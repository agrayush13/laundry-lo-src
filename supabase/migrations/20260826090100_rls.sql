-- Row Level Security for every table.
--
-- The API verifies the Supabase JWT and then talks to Postgres as `anon` or
-- `authenticated` with request.jwt.claims set, so these policies apply to API
-- traffic too rather than only to PostgREST. A bug in a route handler is then
-- a failed query, not a data leak.

-- Supabase grants table privileges to these roles by default; stating them
-- explicitly keeps the migration self-contained.
grant usage on schema public to anon, authenticated;
grant select on public.partners, public.partner_hours, public.partner_tags,
                public.catalog_categories, public.catalog_items, public.slots
    to anon, authenticated;
grant select, insert, update, delete on public.profiles, public.addresses,
                public.carts, public.cart_items, public.orders, public.order_items,
                public.order_addresses, public.order_events, public.memberships,
                public.reviews
    to authenticated;
grant execute on function public.gen_ulid, public.prefixed_id to anon, authenticated;

alter table public.profiles           enable row level security;
alter table public.addresses          enable row level security;
alter table public.partners           enable row level security;
alter table public.partner_hours      enable row level security;
alter table public.partner_tags       enable row level security;
alter table public.catalog_categories enable row level security;
alter table public.catalog_items      enable row level security;
alter table public.slots              enable row level security;
alter table public.carts              enable row level security;
alter table public.cart_items         enable row level security;
alter table public.orders             enable row level security;
alter table public.order_items        enable row level security;
alter table public.order_addresses    enable row level security;
alter table public.order_events       enable row level security;
alter table public.memberships        enable row level security;
alter table public.reviews            enable row level security;

-- Does the caller administer this partner?
create or replace function public.owns_partner(target_partner_id text) returns boolean as $$
    select exists (
        select 1 from public.partners
        where id = target_partner_id and owner_id = auth.uid()
    );
$$ language sql stable security definer set search_path = public;

-- ---------------------------------------------------------------------------
-- Customer-owned rows
-- ---------------------------------------------------------------------------

create policy profiles_select_own on public.profiles
    for select to authenticated using (id = auth.uid());
create policy profiles_update_own on public.profiles
    for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy addresses_own on public.addresses
    for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy carts_own on public.carts
    for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy cart_items_own on public.cart_items
    for all to authenticated
    using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()))
    with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));

create policy memberships_own on public.memberships
    for select to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Partner-owned rows: world readable, writable only by the partner
-- ---------------------------------------------------------------------------

create policy partners_read on public.partners
    for select to anon, authenticated using (true);
create policy partners_write_own on public.partners
    for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy partner_hours_read on public.partner_hours
    for select to anon, authenticated using (true);
create policy partner_hours_write_own on public.partner_hours
    for all to authenticated using (public.owns_partner(partner_id))
    with check (public.owns_partner(partner_id));

create policy partner_tags_read on public.partner_tags
    for select to anon, authenticated using (true);
create policy partner_tags_write_own on public.partner_tags
    for all to authenticated using (public.owns_partner(partner_id))
    with check (public.owns_partner(partner_id));

create policy catalog_categories_read on public.catalog_categories
    for select to anon, authenticated using (true);
create policy catalog_categories_write_own on public.catalog_categories
    for all to authenticated using (public.owns_partner(partner_id))
    with check (public.owns_partner(partner_id));

create policy catalog_items_read on public.catalog_items
    for select to anon, authenticated using (true);
create policy catalog_items_write_own on public.catalog_items
    for all to authenticated
    using (exists (
        select 1 from public.catalog_categories c
        where c.id = category_id and public.owns_partner(c.partner_id)
    ))
    with check (exists (
        select 1 from public.catalog_categories c
        where c.id = category_id and public.owns_partner(c.partner_id)
    ));

create policy slots_read on public.slots
    for select to anon, authenticated using (true);
create policy slots_write_own on public.slots
    for all to authenticated using (public.owns_partner(partner_id))
    with check (public.owns_partner(partner_id));

-- ---------------------------------------------------------------------------
-- Orders: the customer and the partner fulfilling them
-- ---------------------------------------------------------------------------

create policy orders_read on public.orders
    for select to authenticated
    using (user_id = auth.uid() or public.owns_partner(partner_id));
-- There is deliberately no direct insert policy. Order placement goes through
-- the narrow place_order security-definer function added by the customer-write
-- migration, which reprices the cart and reserves both slots atomically.
create policy orders_update_partner on public.orders
    for update to authenticated using (public.owns_partner(partner_id))
    with check (public.owns_partner(partner_id));

create policy order_items_read on public.order_items
    for select to authenticated
    using (exists (
        select 1 from public.orders o
        where o.id = order_id and (o.user_id = auth.uid() or public.owns_partner(o.partner_id))
    ));

create policy order_addresses_read on public.order_addresses
    for select to authenticated
    using (exists (
        select 1 from public.orders o
        where o.id = order_id and (o.user_id = auth.uid() or public.owns_partner(o.partner_id))
    ));

create policy order_events_read on public.order_events
    for select to authenticated
    using (exists (
        select 1 from public.orders o
        where o.id = order_id and (o.user_id = auth.uid() or public.owns_partner(o.partner_id))
    ));
create policy order_events_write_partner on public.order_events
    for insert to authenticated
    with check (exists (
        select 1 from public.orders o
        where o.id = order_id and public.owns_partner(o.partner_id)
    ));

-- ---------------------------------------------------------------------------
-- Reviews: publicly readable, written once by the customer who ordered
-- ---------------------------------------------------------------------------

create policy reviews_read on public.reviews
    for select to anon, authenticated using (true);
create policy reviews_write_own on public.reviews
    for all to authenticated
    using (user_id = auth.uid())
    with check (
        user_id = auth.uid()
        and exists (
            select 1 from public.orders o
            where o.id = order_id and o.user_id = auth.uid() and o.status = 'delivered'
        )
    );
