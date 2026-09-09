-- Owner-managed catalogue fields. Items are deactivated rather than deleted so
-- existing carts keep their references and order snapshots remain intact.

alter table public.catalog_categories
    add constraint catalog_categories_name_length
        check (length(btrim(name)) between 1 and 80),
    add constraint catalog_categories_position_nonnegative check (position >= 0);

alter table public.catalog_items
    add constraint catalog_items_name_length
        check (length(btrim(name)) between 1 and 120),
    add constraint catalog_items_description_length
        check (description is null or length(description) <= 500),
    add constraint catalog_items_price_max check (price <= 100000000),
    add constraint catalog_items_icon_key_length
        check (length(btrim(icon_key)) between 1 and 40),
    add constraint catalog_items_position_nonnegative check (position >= 0);

grant update (name) on public.catalog_categories to authenticated;
grant update (name, description, price, is_active) on public.catalog_items to authenticated;
