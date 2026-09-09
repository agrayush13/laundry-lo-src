-- Laundry owners may build a catalogue after onboarding instead of depending
-- on platform seed data. The functions keep canonical service slugs, display
-- order and launch pricing units behind one narrow database boundary.

create unique index catalog_categories_partner_service_unique
    on public.catalog_categories (partner_id, service);

create or replace function public.create_partner_catalog_category(
    target_partner_id text,
    target_service text,
    category_name text
) returns text as $$
declare
    new_category_id text;
    next_position integer;
begin
    perform 1
    from public.partners partner
    where partner.id = target_partner_id
      and partner.owner_id = auth.uid()
    for update;

    if not found then
        raise exception using errcode = 'P0001', message = 'PARTNER_NOT_FOUND';
    end if;

    if target_service is null or target_service not in (
        'wash-fold', 'wash-iron', 'dry-cleaning', 'premium-care'
    ) then
        raise exception using errcode = 'P0001', message = 'PARTNER_SERVICE_INVALID';
    end if;

    if category_name is null or length(btrim(category_name)) not between 1 and 80 then
        raise exception using errcode = 'P0001', message = 'PARTNER_CATEGORY_NAME_INVALID';
    end if;

    if exists (
        select 1
        from public.catalog_categories category
        where category.partner_id = target_partner_id
          and category.service = target_service
    ) then
        raise exception using errcode = 'P0001', message = 'PARTNER_SERVICE_EXISTS';
    end if;

    select coalesce(max(category.position), -1) + 1
    into next_position
    from public.catalog_categories category
    where category.partner_id = target_partner_id;

    insert into public.catalog_categories (partner_id, service, name, position)
    values (target_partner_id, target_service, btrim(category_name), next_position)
    returning id into new_category_id;

    return new_category_id;
end;
$$ language plpgsql volatile security definer set search_path = public, pg_temp;

revoke all on function public.create_partner_catalog_category(text, text, text) from public;
grant execute on function public.create_partner_catalog_category(text, text, text)
    to authenticated;

create or replace function public.create_partner_catalog_item(
    target_partner_id text,
    target_category_id text,
    item_name text,
    item_description text,
    item_price integer,
    item_is_active boolean
) returns text as $$
declare
    new_item_id text;
    next_position integer;
begin
    perform 1
    from public.catalog_categories category
    join public.partners partner on partner.id = category.partner_id
    where category.id = target_category_id
      and category.partner_id = target_partner_id
      and partner.owner_id = auth.uid()
    for update of category;

    if not found then
        raise exception using errcode = 'P0001', message = 'PARTNER_CATEGORY_NOT_FOUND';
    end if;

    if item_name is null or length(btrim(item_name)) not between 1 and 120 then
        raise exception using errcode = 'P0001', message = 'PARTNER_ITEM_NAME_INVALID';
    end if;

    if item_description is not null and length(item_description) > 500 then
        raise exception using errcode = 'P0001', message = 'PARTNER_ITEM_DESCRIPTION_INVALID';
    end if;

    if item_price is null or item_price not between 0 and 100000000 then
        raise exception using errcode = 'P0001', message = 'PARTNER_ITEM_PRICE_INVALID';
    end if;

    if item_is_active is null then
        raise exception using errcode = 'P0001', message = 'PARTNER_ITEM_AVAILABILITY_INVALID';
    end if;

    select coalesce(max(item.position), -1) + 1
    into next_position
    from public.catalog_items item
    where item.category_id = target_category_id;

    insert into public.catalog_items (
        category_id,
        name,
        description,
        price,
        currency,
        unit,
        icon_key,
        is_active,
        position
    ) values (
        target_category_id,
        btrim(item_name),
        nullif(btrim(item_description), ''),
        item_price,
        'INR',
        'piece',
        'box',
        item_is_active,
        next_position
    )
    returning id into new_item_id;

    return new_item_id;
end;
$$ language plpgsql volatile security definer set search_path = public, pg_temp;

revoke all on function public.create_partner_catalog_item(text, text, text, text, integer, boolean)
    from public;
grant execute on function public.create_partner_catalog_item(text, text, text, text, integer, boolean)
    to authenticated;
