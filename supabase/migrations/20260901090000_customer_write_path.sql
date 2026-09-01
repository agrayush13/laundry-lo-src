-- Authenticated customer writes and the production slot rollover.
--
-- Order placement is deliberately a security-definer database function. It is
-- the one write that must reprice the cart, reserve both slots, snapshot the
-- address and catalogue, and clear the cart atomically. The function still
-- derives the customer from auth.uid(); callers cannot nominate another user.

alter table public.orders
    add column membership_fee integer not null default 0 check (membership_fee >= 0);

create or replace function public.place_order(
    target_cart_id text,
    target_address_id text,
    target_pickup_slot_id text,
    target_delivery_slot_id text,
    target_payment_method text,
    target_idempotency_key text
) returns table (order_id text, replayed boolean) as $$
declare
    caller_id uuid := auth.uid();
    existing_order_id text;
    created_order_id text;
    created_reference text;
    cart_partner_id text;
    cart_has_plus boolean;
    cart_line_count integer;
    priceable_line_count integer;
    item_subtotal integer;
    membership_cost integer := 0;
    order_discount integer := 0;
    order_tax integer;
    order_total integer;
    already_member boolean;
    pickup public.slots%rowtype;
    delivery public.slots%rowtype;
    saved_address public.addresses%rowtype;
begin
    if caller_id is null then
        raise exception using errcode = 'P0001', message = 'UNAUTHENTICATED';
    end if;

    -- Serialize concurrent retries before checking whether the order exists.
    -- Without this lock, two equal requests can both miss the first lookup;
    -- the loser then sees the cart already deleted instead of replaying the
    -- order created by the winner.
    perform pg_advisory_xact_lock(
        hashtextextended(caller_id::text || ':' || target_idempotency_key, 0)
    );

    select o.id into existing_order_id
    from public.orders o
    where o.user_id = caller_id and o.idempotency_key = target_idempotency_key;

    if found then
        return query select existing_order_id, true;
        return;
    end if;

    select c.partner_id, c.has_plus into cart_partner_id, cart_has_plus
    from public.carts c
    where c.id = target_cart_id and c.user_id = caller_id
    for update;

    if not found then
        raise exception using errcode = 'P0001', message = 'CART_NOT_FOUND';
    end if;
    if cart_partner_id is null then
        raise exception using errcode = 'P0001', message = 'CART_EMPTY';
    end if;
    perform 1 from public.partners where id = cart_partner_id for share;
    if not public.is_partner_open(cart_partner_id) then
        raise exception using errcode = 'P0001', message = 'PARTNER_CLOSED';
    end if;

    select count(*)::integer into cart_line_count
    from public.cart_items ci
    where ci.cart_id = target_cart_id;

    select count(*)::integer, coalesce(sum(i.price * ci.quantity), 0)::integer
    into priceable_line_count, item_subtotal
    from public.cart_items ci
    join public.catalog_items i on i.id = ci.item_id and i.is_active
    join public.catalog_categories cc on cc.id = i.category_id
    where ci.cart_id = target_cart_id and cc.partner_id = cart_partner_id;

    if cart_line_count = 0 then
        raise exception using errcode = 'P0001', message = 'CART_EMPTY';
    end if;
    if priceable_line_count <> cart_line_count then
        raise exception using errcode = 'P0001', message = 'CART_CHANGED';
    end if;

    select a.* into saved_address
    from public.addresses a
    where a.id = target_address_id and a.user_id = caller_id;
    if not found then
        raise exception using errcode = 'P0001', message = 'ADDRESS_NOT_FOUND';
    end if;

    -- Pickup always precedes delivery, so concurrent placements acquire slot
    -- locks in chronological order and do not deadlock each other.
    select s.* into pickup
    from public.slots s
    where s.id = target_pickup_slot_id and s.partner_id = cart_partner_id
    for update;
    if not found or pickup.state <> 'open' or pickup.booked >= pickup.capacity
       or pickup.starts_at <= now() then
        raise exception using errcode = 'P0001', message = 'SLOT_UNAVAILABLE';
    end if;

    select s.* into delivery
    from public.slots s
    where s.id = target_delivery_slot_id and s.partner_id = cart_partner_id
    for update;
    if not found or delivery.state <> 'open' or delivery.booked >= delivery.capacity
       or delivery.starts_at <= pickup.starts_at then
        raise exception using errcode = 'P0001', message = 'SLOT_UNAVAILABLE';
    end if;

    select exists (
        select 1 from public.memberships m
        where m.user_id = caller_id and m.is_active and m.renews_at > now()
    ) into already_member;

    if cart_has_plus and not already_member then
        membership_cost := 9900;
    end if;
    if cart_has_plus or already_member then
        order_discount := floor(item_subtotal * 0.10)::integer;
    end if;

    order_tax := round((item_subtotal + membership_cost - order_discount) * 0.18)::integer;
    order_total := item_subtotal + membership_cost - order_discount + order_tax;
    created_order_id := public.prefixed_id('ord');
    created_reference := 'LL-' || to_char(now(), 'YYYY') || '-' || right(created_order_id, 8);

    insert into public.orders (
        id, reference, user_id, partner_id, subtotal, delivery_fee,
        membership_fee, discount, tax, total, currency, pickup_slot_id,
        delivery_slot_id, payment_method, idempotency_key
    ) values (
        created_order_id, created_reference, caller_id, cart_partner_id,
        item_subtotal, 0, membership_cost, order_discount, order_tax,
        order_total, 'INR', target_pickup_slot_id, target_delivery_slot_id,
        target_payment_method, target_idempotency_key
    );

    insert into public.order_items (
        order_id, item_id, name, unit, unit_price, quantity, line_total
    )
    select created_order_id, i.id, i.name, i.unit, i.price, ci.quantity,
           i.price * ci.quantity
    from public.cart_items ci
    join public.catalog_items i on i.id = ci.item_id and i.is_active
    join public.catalog_categories cc on cc.id = i.category_id
    where ci.cart_id = target_cart_id and cc.partner_id = cart_partner_id;

    insert into public.order_addresses (
        order_id, label, recipient_name, phone, building, street, landmark, pincode
    ) values (
        created_order_id, saved_address.label, saved_address.recipient_name,
        saved_address.phone, saved_address.building, saved_address.street,
        saved_address.landmark, saved_address.pincode
    );

    insert into public.order_events (order_id, type)
    values (created_order_id, 'placed');

    update public.slots
    set booked = booked + 1,
        state = case when booked + 1 >= capacity then 'full'::public.slot_state else state end
    where id in (target_pickup_slot_id, target_delivery_slot_id);

    if cart_has_plus and not already_member then
        insert into public.memberships (user_id, plan, renews_at)
        values (caller_id, 'plus', now() + interval '1 month')
        on conflict (user_id) do update
        set plan = excluded.plan,
            started_at = now(),
            renews_at = excluded.renews_at,
            is_active = true;
    end if;

    delete from public.carts where id = target_cart_id and user_id = caller_id;

    return query select created_order_id, false;
end;
$$ language plpgsql volatile security definer set search_path = public, pg_temp;

revoke execute on function public.place_order(text, text, text, text, text, text)
    from public, anon;
grant execute on function public.place_order(text, text, text, text, text, text)
    to authenticated;

-- Keep a rolling 14-day window for every partner. `auto_schedule` controls
-- whether opening hours also toggle the live open/closed state; it does not
-- control whether customers need bookable slots.
create or replace function public.refresh_scheduled_slots(days integer default 14)
returns integer as $$
declare
    partner record;
    created integer := 0;
begin
    if days < 1 or days > 31 then
        raise exception using errcode = '22023', message = 'days must be between 1 and 31';
    end if;

    for partner in select id from public.partners loop
        created := created + public.generate_slots(
            partner.id,
            timezone('Asia/Kolkata', now())::date,
            days
        );
    end loop;
    return created;
end;
$$ language plpgsql volatile security definer set search_path = public, pg_temp;

revoke execute on function public.refresh_scheduled_slots(integer)
    from public, anon, authenticated;
grant execute on function public.refresh_scheduled_slots(integer) to service_role;

-- Supabase production exposes pg_cron. Plain-Postgres CI does not, so the
-- migration installs the daily job only where the extension is available.
do $$
begin
    if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
        create extension if not exists pg_cron;
        if not exists (select 1 from cron.job where jobname = 'laundrylo-slot-rollover') then
            perform cron.schedule(
                'laundrylo-slot-rollover',
                '15 18 * * *',
                'select public.refresh_scheduled_slots(14)'
            );
        end if;
    end if;
end
$$;
