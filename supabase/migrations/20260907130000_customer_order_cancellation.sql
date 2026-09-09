-- Customers may cancel their own service-only cash-on-pickup order before the
-- scheduled pickup and before a laundry records pickup. Status, tracking and
-- both slot reservations change atomically. Plus-activation orders remain a
-- support case until membership reversal and refund policy is defined.

create or replace function public.cancel_order(
    target_order_id text
) returns table (
    order_id text,
    status public.order_status,
    event_type public.order_event,
    occurred_at timestamptz
) as $$
declare
    caller_id uuid := auth.uid();
    order_user_id uuid;
    current_status public.order_status;
    current_payment_method text;
    current_membership_fee integer;
    pickup_slot text;
    delivery_slot text;
    pickup_starts_at timestamptz;
    latest_event public.order_event;
    recorded_at timestamptz;
begin
    if caller_id is null then
        raise exception using message = 'UNAUTHENTICATED', errcode = 'P0001';
    end if;

    -- The row lock serializes cancellation with fulfilment and repeated taps.
    select o.user_id, o.status, o.payment_method, o.membership_fee,
           o.pickup_slot_id, o.delivery_slot_id, pickup.starts_at
      into order_user_id, current_status, current_payment_method,
           current_membership_fee, pickup_slot, delivery_slot, pickup_starts_at
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
       or pickup_starts_at <= now()
       or current_payment_method <> 'cash_on_pickup'
       or current_membership_fee <> 0 then
        raise exception using message = 'CANCELLATION_NOT_ALLOWED', errcode = 'P0001';
    end if;

    insert into public.order_events as recorded (order_id, type)
    values (target_order_id, 'cancelled')
    returning recorded.occurred_at into recorded_at;

    update public.orders
       set status = 'cancelled'
     where id = target_order_id;

    update public.slots
       set booked = greatest(booked - 1, 0),
           state = case
               when state = 'full' and booked - 1 < capacity then 'open'::public.slot_state
               else state
           end
     where id in (pickup_slot, delivery_slot);

    return query
    select target_order_id, 'cancelled'::public.order_status,
           'cancelled'::public.order_event, recorded_at;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

revoke all on function public.cancel_order(text) from public, anon;
grant execute on function public.cancel_order(text) to authenticated;
