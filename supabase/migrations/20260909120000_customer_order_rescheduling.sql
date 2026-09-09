-- Customers may move an order to a different available pickup/delivery pair
-- before pickup. The order, old/new slot capacity and immutable before/after
-- audit record change together so a failed or concurrent request cannot leave
-- availability out of sync.

create table public.order_reschedules (
    id                   bigint generated always as identity primary key,
    order_id             text        not null references public.orders (id) on delete cascade,
    -- Snapshot the actor UUID without a profile FK so a future account-erasure
    -- policy can remove identity data without destroying the order audit.
    actor_user_id        uuid        not null,
    previous_pickup_id   text        not null references public.slots (id) on delete restrict,
    previous_delivery_id text        not null references public.slots (id) on delete restrict,
    new_pickup_id        text        not null references public.slots (id) on delete restrict,
    new_delivery_id      text        not null references public.slots (id) on delete restrict,
    created_at           timestamptz not null default now(),
    constraint order_reschedules_changed check (
        previous_pickup_id <> new_pickup_id
        or previous_delivery_id <> new_delivery_id
    )
);

create index order_reschedules_order_created_idx
    on public.order_reschedules (order_id, created_at, id);

grant select on public.order_reschedules to authenticated;
revoke insert, update, delete on public.order_reschedules from authenticated;
alter table public.order_reschedules enable row level security;

create policy order_reschedules_read on public.order_reschedules
    for select to authenticated
    using (exists (
        select 1 from public.orders o
        where o.id = order_id
          and (o.user_id = auth.uid() or public.owns_partner(o.partner_id))
    ));

create or replace function public.reschedule_order(
    target_order_id text,
    target_pickup_slot_id text,
    target_delivery_slot_id text
) returns table (
    order_id text,
    rescheduled_at timestamptz
) as $$
declare
    caller_id uuid := auth.uid();
    order_user_id uuid;
    order_partner_id text;
    current_status public.order_status;
    previous_pickup_id text;
    previous_delivery_id text;
    previous_pickup_starts_at timestamptz;
    latest_event public.order_event;
    new_pickup public.slots%rowtype;
    new_delivery public.slots%rowtype;
    recorded_at timestamptz;
begin
    if caller_id is null then
        raise exception using message = 'UNAUTHENTICATED', errcode = 'P0001';
    end if;

    -- Serialize against fulfilment, cancellation and another reschedule first.
    select o.user_id, o.partner_id, o.status, o.pickup_slot_id,
           o.delivery_slot_id, pickup.starts_at
      into order_user_id, order_partner_id, current_status,
           previous_pickup_id, previous_delivery_id, previous_pickup_starts_at
      from public.orders o
      join public.slots pickup on pickup.id = o.pickup_slot_id
     where o.id = target_order_id
       for update of o;

    if not found or order_user_id is distinct from caller_id then
        raise exception using message = 'ORDER_NOT_FOUND', errcode = 'P0001';
    end if;

    select e.type
      into latest_event
      from public.order_events e
     where e.order_id = target_order_id
     order by e.occurred_at desc, e.id desc
     limit 1;

    if current_status <> 'processing'
       or latest_event is null
       or latest_event not in ('placed', 'confirmed')
       or previous_pickup_starts_at <= now() then
        raise exception using message = 'RESCHEDULING_NOT_ALLOWED', errcode = 'P0001';
    end if;

    if previous_pickup_id = target_pickup_slot_id
       and previous_delivery_id = target_delivery_slot_id then
        raise exception using message = 'RESCHEDULE_UNCHANGED', errcode = 'P0001';
    end if;

    -- All slot locks use stable id order, including the old reservations, so
    -- crossing reschedules cannot deadlock each other.
    perform s.id
      from public.slots s
     where s.id = any(array[
         previous_pickup_id,
         previous_delivery_id,
         target_pickup_slot_id,
         target_delivery_slot_id
     ])
     order by s.id
     for update;

    select s.* into new_pickup
      from public.slots s
     where s.id = target_pickup_slot_id;
    if not found
       or new_pickup.partner_id <> order_partner_id
       or new_pickup.starts_at <= now()
       or (
           target_pickup_slot_id not in (previous_pickup_id, previous_delivery_id)
           and (new_pickup.state <> 'open' or new_pickup.booked >= new_pickup.capacity)
       ) then
        raise exception using message = 'SLOT_UNAVAILABLE', errcode = 'P0001';
    end if;

    select s.* into new_delivery
      from public.slots s
     where s.id = target_delivery_slot_id;
    if not found
       or new_delivery.partner_id <> order_partner_id
       or new_delivery.starts_at <= new_pickup.starts_at
       or (
           target_delivery_slot_id not in (previous_pickup_id, previous_delivery_id)
           and (new_delivery.state <> 'open' or new_delivery.booked >= new_delivery.capacity)
       ) then
        raise exception using message = 'SLOT_UNAVAILABLE', errcode = 'P0001';
    end if;

    update public.slots
       set booked = greatest(booked - 1, 0),
           state = case
               when state = 'full' and booked - 1 < capacity then 'open'::public.slot_state
               else state
           end
     where id in (previous_pickup_id, previous_delivery_id)
       and not (id = any(array[target_pickup_slot_id, target_delivery_slot_id]));

    update public.slots
       set booked = booked + 1,
           state = case
               when booked + 1 >= capacity then 'full'::public.slot_state
               else state
           end
     where id in (target_pickup_slot_id, target_delivery_slot_id)
       and not (id = any(array[previous_pickup_id, previous_delivery_id]));

    update public.orders
       set pickup_slot_id = target_pickup_slot_id,
           delivery_slot_id = target_delivery_slot_id
     where id = target_order_id;

    insert into public.order_reschedules (
        order_id, actor_user_id, previous_pickup_id, previous_delivery_id,
        new_pickup_id, new_delivery_id
    ) values (
        target_order_id, caller_id, previous_pickup_id, previous_delivery_id,
        target_pickup_slot_id, target_delivery_slot_id
    ) returning created_at into recorded_at;

    return query select target_order_id, recorded_at;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

revoke all on function public.reschedule_order(text, text, text) from public, anon;
grant execute on function public.reschedule_order(text, text, text) to authenticated;
