-- Keep checkout serviceability aligned with marketplace search. The current
-- launch rule is exact pincode: a partner serves the pincode stored on its
-- listing. Radius coverage can replace this trigger once partner service areas
-- become an explicit model.

create or replace function public.enforce_order_address_serviceability()
returns trigger as $$
declare
    service_pincode text;
begin
    select p.pincode into service_pincode
    from public.orders o
    join public.partners p on p.id = o.partner_id
    where o.id = new.order_id;

    if service_pincode is null then
        raise exception using errcode = 'P0001', message = 'ORDER_NOT_FOUND';
    end if;

    if new.pincode <> service_pincode then
        raise exception using errcode = 'P0001', message = 'ADDRESS_NOT_SERVICEABLE';
    end if;

    return new;
end;
$$ language plpgsql volatile security definer set search_path = public, pg_temp;

revoke all on function public.enforce_order_address_serviceability() from public;

create trigger order_addresses_enforce_serviceability
    before insert or update of order_id, pincode on public.order_addresses
    for each row execute function public.enforce_order_address_serviceability();
