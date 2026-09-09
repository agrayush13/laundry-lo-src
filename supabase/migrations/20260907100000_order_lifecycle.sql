-- Laundry owners advance an order through one ordered lifecycle. Keep the
-- state change and customer-visible tracking event in the same transaction,
-- and expose only this operation rather than broad table writes.

create unique index order_events_order_type_idx
    on public.order_events (order_id, type);

create index partners_owner_idx
    on public.partners (owner_id) where owner_id is not null;
create index orders_partner_status_placed_idx
    on public.orders (partner_id, status, placed_at desc, id desc);

drop policy if exists orders_update_partner on public.orders;
drop policy if exists order_events_write_partner on public.order_events;
revoke update on public.orders from authenticated;
revoke insert on public.order_events from authenticated;

create or replace function public.advance_order(
    target_order_id text,
    next_event text
) returns table (
    order_id text,
    status public.order_status,
    event_type public.order_event,
    occurred_at timestamptz
) as $$
declare
    caller_id uuid := auth.uid();
    current_partner_id text;
    current_status public.order_status;
    latest_event public.order_event;
    required_event text;
    recorded_at timestamptz;
    derived_status public.order_status;
begin
    if caller_id is null then
        raise exception using message = 'UNAUTHENTICATED', errcode = 'P0001';
    end if;

    -- The row lock serializes two devices trying to advance the same order.
    select o.partner_id, o.status
      into current_partner_id, current_status
      from public.orders o
     where o.id = target_order_id
       for update;

    -- Do not disclose whether an order exists to a different customer or
    -- laundry owner.
    if not found or not exists (
        select 1
          from public.partners p
         where p.id = current_partner_id
           and p.owner_id = caller_id
    ) then
        raise exception using message = 'ORDER_NOT_FOUND', errcode = 'P0001';
    end if;

    if current_status in ('delivered', 'cancelled') then
        raise exception using message = 'INVALID_ORDER_TRANSITION', errcode = 'P0001';
    end if;

    select e.type
      into latest_event
      from public.order_events e
     where e.order_id = target_order_id
     order by e.occurred_at desc, e.id desc
     limit 1;

    required_event := case latest_event
        when 'placed' then 'confirmed'
        when 'confirmed' then 'picked_up'
        when 'picked_up' then 'in_progress'
        when 'in_progress' then 'out_for_delivery'
        when 'out_for_delivery' then 'delivered'
        else null
    end;

    if required_event is null or next_event is distinct from required_event then
        raise exception using message = 'INVALID_ORDER_TRANSITION', errcode = 'P0001';
    end if;

    derived_status := case next_event
        when 'out_for_delivery' then 'out_for_delivery'::public.order_status
        when 'delivered' then 'delivered'::public.order_status
        else 'processing'::public.order_status
    end;

    insert into public.order_events as recorded (order_id, type)
    values (target_order_id, next_event::public.order_event)
    returning recorded.occurred_at into recorded_at;

    update public.orders
       set status = derived_status
     where id = target_order_id;

    return query
    select target_order_id, derived_status, next_event::public.order_event, recorded_at;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

revoke all on function public.advance_order(text, text) from public;
grant execute on function public.advance_order(text, text) to authenticated;
