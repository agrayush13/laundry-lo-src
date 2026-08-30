-- Derived data behind the listing: distance, services, starting price, and the
-- slot rows the client is forbidden from inventing.

-- ---------------------------------------------------------------------------
-- 1. Distance
-- ---------------------------------------------------------------------------

-- A search is by pincode, so distance is measured from that pincode's centroid
-- unless the caller passes real coordinates. PostGIS would be the answer at
-- city scale; at this size a haversine in SQL is the whole job and costs no
-- extension.
create table public.pincode_centroids (
    pincode   text primary key check (pincode ~ '^[0-9]{6}$'),
    city      text not null,
    latitude  numeric(9, 6) not null,
    longitude numeric(9, 6) not null
);

grant select on public.pincode_centroids to anon, authenticated;
alter table public.pincode_centroids enable row level security;
create policy pincode_centroids_read on public.pincode_centroids
    for select to anon, authenticated using (true);

create or replace function public.haversine_meters(
    lat1 numeric, lon1 numeric, lat2 numeric, lon2 numeric
) returns integer as $$
    select case
        when lat1 is null or lon1 is null or lat2 is null or lon2 is null then null
        else round(
            6371000 * 2 * asin(sqrt(
                power(sin(radians(lat2::double precision - lat1::double precision) / 2), 2)
                + cos(radians(lat1::double precision)) * cos(radians(lat2::double precision))
                * power(sin(radians(lon2::double precision - lon1::double precision) / 2), 2)
            ))
        )::integer
    end;
$$ language sql immutable;

-- ---------------------------------------------------------------------------
-- 2. Partner listing view
-- ---------------------------------------------------------------------------

-- `services` and `starting_price` are derived, never stored, so they cannot
-- drift from what the partner actually sells. security_invoker keeps the
-- caller's RLS in force through the view.
create view public.partner_details with (security_invoker = true) as
select
    p.*,
    coalesce(t.tags, '{}') as tags,
    coalesce(s.services, '{}') as services,
    s.starting_price,
    s.starting_unit
from public.partners p
left join lateral (
    select array_agg(pt.tag order by pt.tag) as tags
    from public.partner_tags pt
    where pt.partner_id = p.id
) t on true
left join lateral (
    select
        array_agg(distinct c.service) as services,
        min(i.price) as starting_price,
        (array_agg(i.unit order by i.price))[1] as starting_unit
    from public.catalog_categories c
    join public.catalog_items i on i.category_id = c.id and i.is_active
    where c.partner_id = p.id
) s on true;

grant select on public.partner_details to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Slot generation
-- ---------------------------------------------------------------------------

-- Generated rows rather than windows derived from partner_hours at read time:
-- a row can be blocked for a holiday, and `booked` has somewhere to live, which
-- is what makes 409 SLOT_UNAVAILABLE truthful under concurrency.
create or replace function public.generate_slots(
    target_partner_id text,
    from_date date,
    days integer default 7,
    slot_hours integer default 2,
    slot_capacity integer default 8
) returns integer as $$
declare
    zone constant text := 'Asia/Kolkata';
    day_offset integer;
    day_date date;
    opens time;
    closes time;
    cursor_ts timestamptz;
    day_end timestamptz;
    inserted integer;
    created integer := 0;
begin
    for day_offset in 0..(days - 1) loop
        day_date := from_date + day_offset;

        -- weekday 0 = Sunday, matching extract(dow).
        select h.opens_at, h.closes_at into opens, closes
        from public.partner_hours h
        where h.partner_id = target_partner_id
          and h.weekday = extract(dow from day_date)::smallint;

        -- No hours row, or a day the partner is shut.
        continue when not found or opens is null;

        cursor_ts := timezone(zone, (day_date + opens)::timestamp);
        day_end   := timezone(zone, (day_date + closes)::timestamp);

        while cursor_ts + make_interval(hours => slot_hours) <= day_end loop
            insert into public.slots (partner_id, starts_at, ends_at, capacity)
            values (
                target_partner_id,
                cursor_ts,
                cursor_ts + make_interval(hours => slot_hours),
                slot_capacity
            )
            on conflict (partner_id, starts_at) do nothing;

            get diagnostics inserted = row_count;
            created := created + inserted;
            cursor_ts := cursor_ts + make_interval(hours => slot_hours);
        end loop;
    end loop;

    return created;
end;
$$ language plpgsql volatile security definer set search_path = public;

-- ---------------------------------------------------------------------------
-- 4. Open / closed
-- ---------------------------------------------------------------------------

-- `is_open` is the admin panel's manual switch. When a partner opts into
-- auto_schedule, opening hours decide instead, and the switch becomes a way to
-- shut early rather than a way to open outside hours.
create or replace function public.is_partner_open(target_partner_id text) returns boolean as $$
declare
    zone constant text := 'Asia/Kolkata';
    local_now timestamp;
    p record;
    h record;
begin
    select is_open, auto_schedule into p from public.partners where id = target_partner_id;
    if not found then
        return false;
    end if;
    if not p.auto_schedule then
        return p.is_open;
    end if;

    local_now := timezone(zone, now());
    select opens_at, closes_at into h
    from public.partner_hours
    where partner_id = target_partner_id
      and weekday = extract(dow from local_now)::smallint;

    if not found or h.opens_at is null then
        return false;
    end if;

    return p.is_open
        and local_now::time >= h.opens_at
        and local_now::time < h.closes_at;
end;
$$ language plpgsql stable;

grant execute on function public.haversine_meters, public.is_partner_open to anon, authenticated;
