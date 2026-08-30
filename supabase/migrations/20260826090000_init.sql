-- laundrylo initial schema. Implements docs/schema.md.
--
-- Conventions held throughout: opaque prefixed ULID text ids, money as integer
-- minor units alongside a currency, timestamptz in UTC, lowercase snake enums.

-- ---------------------------------------------------------------------------
-- 1. Id generation
-- ---------------------------------------------------------------------------

-- Crockford base32 ULID: 10 chars of millisecond timestamp, 16 of randomness.
-- Sorts lexicographically by creation time, which keeps btree inserts local
-- without leaking a sequential count the way a serial does.
create or replace function public.gen_ulid() returns text as $$
declare
    alphabet constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    ms bigint := (extract(epoch from clock_timestamp()) * 1000)::bigint;
    result text := '';
begin
    for _ in 1..10 loop
        result := substr(alphabet, (ms % 32)::int + 1, 1) || result;
        ms := ms / 32;
    end loop;
    for _ in 1..16 loop
        result := result || substr(alphabet, floor(random() * 32)::int + 1, 1);
    end loop;
    return result;
end;
$$ language plpgsql volatile;

create or replace function public.prefixed_id(prefix text) returns text as $$
    select prefix || '_' || public.gen_ulid();
$$ language sql volatile;

-- ---------------------------------------------------------------------------
-- 2. Enums
-- ---------------------------------------------------------------------------

-- All three units exist from day one so bag and kg pricing arrive without a
-- migration; launch only ever writes 'piece'.
create type unit_type       as enum ('piece', 'bag', 'kg');
create type order_status    as enum ('processing', 'out_for_delivery', 'delivered', 'cancelled');
create type order_event     as enum ('placed', 'confirmed', 'picked_up', 'in_progress',
                                     'out_for_delivery', 'delivered', 'cancelled');
create type slot_state      as enum ('open', 'full', 'blocked');
create type membership_plan as enum ('plus');

-- ---------------------------------------------------------------------------
-- 3. updated_at
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at() returns trigger as $$
begin
    new.updated_at := now();
    return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- 4. Identity
-- ---------------------------------------------------------------------------

create table public.profiles (
    id           uuid primary key references auth.users (id) on delete cascade,
    full_name    text,
    phone        text,
    sms_opt_in   boolean     not null default true,
    email_opt_in boolean     not null default false,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now()
);

create trigger profiles_touch before update on public.profiles
    for each row execute function public.touch_updated_at();

-- Supabase owns the credentials; the profile row is created alongside them so
-- GET /me never has to decide whether it is also a write.
create or replace function public.handle_new_user() returns trigger as $$
begin
    insert into public.profiles (id, full_name, phone)
    values (
        new.id,
        nullif(new.raw_user_meta_data ->> 'full_name', ''),
        nullif(new.raw_user_meta_data ->> 'phone', '')
    )
    on conflict (id) do nothing;
    return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created after insert on auth.users
    for each row execute function public.handle_new_user();

create table public.addresses (
    id             text primary key default public.prefixed_id('adr'),
    user_id        uuid        not null references public.profiles (id) on delete cascade,
    label          text        not null,
    recipient_name text        not null,
    phone          text        not null,
    building       text        not null,
    street         text        not null,
    landmark       text,
    pincode        text        not null check (pincode ~ '^[0-9]{6}$'),
    is_default     boolean     not null default false,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now()
);

create trigger addresses_touch before update on public.addresses
    for each row execute function public.touch_updated_at();

create index addresses_user_id_idx on public.addresses (user_id);
create index addresses_pincode_idx on public.addresses (pincode);
-- At most one default per user, enforced rather than hoped for.
create unique index addresses_one_default_per_user_idx
    on public.addresses (user_id) where is_default;

-- ---------------------------------------------------------------------------
-- 5. Partners
-- ---------------------------------------------------------------------------

create table public.partners (
    id               text primary key default public.prefixed_id('ptr'),
    owner_id         uuid references public.profiles (id) on delete set null,
    name             text        not null,
    about            text,
    line1            text        not null,
    line2            text        not null default '',
    city             text        not null,
    pincode          text        not null check (pincode ~ '^[0-9]{6}$'),
    latitude         numeric(9, 6),
    longitude        numeric(9, 6),
    turnaround_hours integer     not null check (turnaround_hours > 0),
    is_open          boolean     not null default true,
    auto_schedule    boolean     not null default false,
    image_url        text,
    image_alt        text,
    -- Denormalised until reviews ship, when they become an aggregate over
    -- public.reviews and stop being writable directly.
    rating           numeric(2, 1) check (rating between 0 and 5),
    review_count     integer     not null default 0 check (review_count >= 0),
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now()
);

create trigger partners_touch before update on public.partners
    for each row execute function public.touch_updated_at();

create index partners_pincode_idx      on public.partners (pincode);
create index partners_pincode_open_idx on public.partners (pincode, is_open);

create table public.partner_hours (
    partner_id text     not null references public.partners (id) on delete cascade,
    weekday    smallint not null check (weekday between 0 and 6),
    opens_at   time,
    closes_at  time,
    primary key (partner_id, weekday),
    -- Either both ends are set or the partner is shut that day.
    constraint partner_hours_pair check (
        (opens_at is null) = (closes_at is null)
    )
);

create table public.partner_tags (
    partner_id text not null references public.partners (id) on delete cascade,
    tag        text not null,
    primary key (partner_id, tag)
);

create index partner_tags_tag_idx on public.partner_tags (tag);

-- ---------------------------------------------------------------------------
-- 6. Catalogue
-- ---------------------------------------------------------------------------

create table public.catalog_categories (
    id         text primary key default public.prefixed_id('cat'),
    partner_id text        not null references public.partners (id) on delete cascade,
    -- The platform's vocabulary; `name` is the partner's. Kept apart so a
    -- partner can rename a category without falling out of a services= filter.
    service    text        not null,
    name       text        not null,
    position   integer     not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger catalog_categories_touch before update on public.catalog_categories
    for each row execute function public.touch_updated_at();

create index catalog_categories_service_partner_idx
    on public.catalog_categories (service, partner_id);
create index catalog_categories_partner_idx
    on public.catalog_categories (partner_id, position);

create table public.catalog_items (
    id          text primary key default public.prefixed_id('itm'),
    category_id text        not null references public.catalog_categories (id) on delete cascade,
    name        text        not null,
    description text,
    price       integer     not null check (price >= 0),
    currency    text        not null default 'INR',
    unit        unit_type   not null default 'piece',
    icon_key    text        not null,
    is_active   boolean     not null default true,
    position    integer     not null default 0,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

create trigger catalog_items_touch before update on public.catalog_items
    for each row execute function public.touch_updated_at();

create index catalog_items_category_idx on public.catalog_items (category_id, position);

-- ---------------------------------------------------------------------------
-- 7. Slots
-- ---------------------------------------------------------------------------

create table public.slots (
    id         text primary key default public.prefixed_id('slt'),
    partner_id text        not null references public.partners (id) on delete cascade,
    starts_at  timestamptz not null,
    ends_at    timestamptz not null,
    capacity   integer     not null check (capacity > 0),
    booked     integer     not null default 0 check (booked >= 0),
    state      slot_state  not null default 'open',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint slots_end_after_start check (ends_at > starts_at),
    constraint slots_not_overbooked  check (booked <= capacity),
    constraint slots_unique_window   unique (partner_id, starts_at)
);

create trigger slots_touch before update on public.slots
    for each row execute function public.touch_updated_at();

create index slots_partner_starts_idx on public.slots (partner_id, starts_at);

-- ---------------------------------------------------------------------------
-- 8. Cart
-- ---------------------------------------------------------------------------

create table public.carts (
    id         text primary key default public.prefixed_id('crt'),
    user_id    uuid unique not null references public.profiles (id) on delete cascade,
    partner_id text references public.partners (id) on delete set null,
    has_plus   boolean     not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger carts_touch before update on public.carts
    for each row execute function public.touch_updated_at();

create table public.cart_items (
    cart_id  text    not null references public.carts (id) on delete cascade,
    item_id  text    not null references public.catalog_items (id) on delete cascade,
    quantity integer not null check (quantity > 0),
    primary key (cart_id, item_id)
);

-- ---------------------------------------------------------------------------
-- 9. Orders
-- ---------------------------------------------------------------------------

create table public.orders (
    id                text primary key default public.prefixed_id('ord'),
    reference         text unique not null,
    user_id           uuid         not null references public.profiles (id) on delete restrict,
    partner_id        text         not null references public.partners (id) on delete restrict,
    status            order_status not null default 'processing',
    subtotal          integer      not null check (subtotal >= 0),
    delivery_fee      integer      not null default 0 check (delivery_fee >= 0),
    discount          integer      not null default 0 check (discount >= 0),
    tax               integer      not null default 0 check (tax >= 0),
    total             integer      not null check (total >= 0),
    currency          text         not null default 'INR',
    pickup_slot_id    text         not null references public.slots (id) on delete restrict,
    delivery_slot_id  text         not null references public.slots (id) on delete restrict,
    payment_method    text         not null default 'cash_on_pickup',
    idempotency_key   text         not null,
    placed_at         timestamptz  not null default now(),
    created_at        timestamptz  not null default now(),
    updated_at        timestamptz  not null default now()
);

create trigger orders_touch before update on public.orders
    for each row execute function public.touch_updated_at();

-- A replayed Place Order tap returns the original rather than creating a twin.
create unique index orders_user_idempotency_idx on public.orders (user_id, idempotency_key);
create index orders_user_placed_idx on public.orders (user_id, placed_at desc);
create index orders_partner_placed_idx on public.orders (partner_id, placed_at desc);

-- Line items are a snapshot: a later catalogue edit must not rewrite history.
create table public.order_items (
    order_id   text      not null references public.orders (id) on delete cascade,
    item_id    text      not null,
    name       text      not null,
    unit       unit_type not null,
    unit_price integer   not null check (unit_price >= 0),
    quantity   integer   not null check (quantity > 0),
    line_total integer   not null check (line_total >= 0),
    primary key (order_id, item_id)
);

-- The address is copied too, so editing or deleting a saved address leaves
-- past orders untouched.
create table public.order_addresses (
    order_id       text primary key references public.orders (id) on delete cascade,
    label          text not null,
    recipient_name text not null,
    phone          text not null,
    building       text not null,
    street         text not null,
    landmark       text,
    pincode        text not null
);

-- Facts that happened. No labels, no formatted times, no done/current/pending:
-- the client derives every bit of that from the sequence.
create table public.order_events (
    id          bigint generated always as identity primary key,
    order_id    text        not null references public.orders (id) on delete cascade,
    type        order_event not null,
    occurred_at timestamptz not null default now(),
    note        text
);

create index order_events_order_idx on public.order_events (order_id, occurred_at);

-- ---------------------------------------------------------------------------
-- 10. Membership
-- ---------------------------------------------------------------------------

create table public.memberships (
    user_id    uuid primary key references public.profiles (id) on delete cascade,
    plan       membership_plan not null default 'plus',
    started_at timestamptz     not null default now(),
    renews_at  timestamptz     not null,
    is_active  boolean         not null default true,
    created_at timestamptz     not null default now(),
    updated_at timestamptz     not null default now()
);

create trigger memberships_touch before update on public.memberships
    for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 11. Reviews (deferred, designed now so rating has a real source later)
-- ---------------------------------------------------------------------------

create table public.reviews (
    id         text primary key default public.prefixed_id('rev'),
    order_id   text unique not null references public.orders (id) on delete cascade,
    user_id    uuid        not null references public.profiles (id) on delete cascade,
    partner_id text        not null references public.partners (id) on delete cascade,
    rating     smallint    not null check (rating between 1 and 5),
    comment    text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger reviews_touch before update on public.reviews
    for each row execute function public.touch_updated_at();

create index reviews_partner_idx on public.reviews (partner_id);
