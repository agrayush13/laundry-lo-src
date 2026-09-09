-- Owner-managed per-date slot capacity. Weekly hours still define when a
-- laundry operates; this table changes how many orders each generated window
-- can accept on an exceptional local date.

create table public.partner_capacity_overrides (
    partner_id text not null references public.partners(id) on delete cascade,
    capacity_date date not null,
    capacity integer not null check (capacity between 1 and 100),
    note text,
    primary key (partner_id, capacity_date),
    constraint partner_capacity_overrides_note_length
        check (note is null or length(note) <= 120)
);

create index partner_capacity_overrides_date_idx
    on public.partner_capacity_overrides (capacity_date, partner_id);

grant select on public.partner_capacity_overrides to authenticated;
revoke insert, update, delete, truncate, references, trigger
    on public.partner_capacity_overrides from anon, authenticated;

alter table public.partner_capacity_overrides enable row level security;

create policy partner_capacity_overrides_read_own on public.partner_capacity_overrides
    for select to authenticated using (public.owns_partner(partner_id));

-- Scheduled slot creation now consults a date-specific capacity before falling
-- back to the platform default passed by the caller.
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
    effective_capacity integer;
    cursor_ts timestamptz;
    day_end timestamptz;
    inserted integer;
    created integer := 0;
begin
    if days < 1 or days > 31 then
        raise exception using errcode = '22023', message = 'days must be between 1 and 31';
    end if;
    if slot_hours < 1 or slot_hours > 24 then
        raise exception using errcode = '22023', message = 'slot_hours must be between 1 and 24';
    end if;
    if slot_capacity < 1 then
        raise exception using errcode = '22023', message = 'slot_capacity must be positive';
    end if;

    for day_offset in 0..(days - 1) loop
        day_date := from_date + day_offset;

        continue when exists (
            select 1
            from public.partner_holiday_closures closure
            where closure.partner_id = target_partner_id
              and closure.closure_date = day_date
        );

        select h.opens_at, h.closes_at into opens, closes
        from public.partner_hours h
        where h.partner_id = target_partner_id
          and h.weekday = extract(dow from day_date)::smallint;

        continue when not found or opens is null;

        select coalesce(
            (
                select override.capacity
                from public.partner_capacity_overrides override
                where override.partner_id = target_partner_id
                  and override.capacity_date = day_date
            ),
            slot_capacity
        ) into effective_capacity;

        cursor_ts := timezone(zone, (day_date + opens)::timestamp);
        day_end := timezone(zone, (day_date + closes)::timestamp);

        while cursor_ts + make_interval(hours => slot_hours) <= day_end loop
            insert into public.slots (partner_id, starts_at, ends_at, capacity)
            values (
                target_partner_id,
                cursor_ts,
                cursor_ts + make_interval(hours => slot_hours),
                effective_capacity
            )
            on conflict (partner_id, starts_at) do nothing;

            get diagnostics inserted = row_count;
            created := created + inserted;
            cursor_ts := cursor_ts + make_interval(hours => slot_hours);
        end loop;
    end loop;

    return created;
end;
$$ language plpgsql volatile security definer set search_path = public, pg_temp;

revoke execute on function public.generate_slots(text, date, integer, integer, integer)
    from public, anon, authenticated;
grant execute on function public.generate_slots(text, date, integer, integer, integer)
    to service_role;

create or replace function public.replace_partner_capacity_overrides(
    target_partner_id text,
    overrides jsonb
) returns void as $$
declare
    zone constant text := 'Asia/Kolkata';
    default_capacity constant integer := 8;
    local_today date := timezone(zone, now())::date;
    overrides_valid boolean;
    capacity_conflict boolean;
begin
    perform 1
    from public.partners partner
    where partner.id = target_partner_id
      and partner.owner_id = auth.uid()
    for update;

    if not found then
        raise exception using errcode = 'P0001', message = 'PARTNER_NOT_FOUND';
    end if;

    if jsonb_typeof(overrides) is distinct from 'array' then
        raise exception using errcode = 'P0001', message = 'PARTNER_CAPACITY_OVERRIDES_INVALID';
    end if;

    select
        count(*) <= 60
        and count(*) = count(distinct entry.capacity_date)
        and coalesce(bool_and((entry.capacity_date >= local_today) is true), true)
        and coalesce(bool_and((entry.capacity between 1 and 100) is true), true)
        and coalesce(bool_and(length(entry.note) <= 120), true)
    into overrides_valid
    from (
        select
            value."date"::date as capacity_date,
            value.capacity,
            btrim(coalesce(value.note, '')) as note
        from jsonb_to_recordset(overrides) as value("date" text, capacity integer, note text)
    ) entry;

    if overrides_valid is not true then
        raise exception using errcode = 'P0001', message = 'PARTNER_CAPACITY_OVERRIDES_INVALID';
    end if;

    -- Serialize with order placement before checking the proposed limit. If a
    -- checkout owns a slot first, this waits and sees its booking; if settings
    -- own it first, checkout later sees the committed capacity.
    perform 1
    from public.slots slot
    where slot.partner_id = target_partner_id
      and slot.starts_at > now()
    for update;

    -- Reject a reduction that would make an existing reservation exceed the
    -- proposed limit. Removing an override proposes the default capacity.
    with requested as (
        select
            value."date"::date as capacity_date,
            value.capacity
        from jsonb_to_recordset(overrides) as value("date" text, capacity integer)
    )
    select exists (
        select 1
        from public.slots slot
        left join requested
          on requested.capacity_date = timezone(zone, slot.starts_at)::date
        where slot.partner_id = target_partner_id
          and slot.starts_at > now()
          and slot.booked > coalesce(requested.capacity, default_capacity)
    ) into capacity_conflict;

    if capacity_conflict then
        raise exception using errcode = 'P0001', message = 'PARTNER_CAPACITY_BELOW_BOOKED';
    end if;

    -- Historical overrides remain an operational record. The settings replace
    -- only today and future dates.
    delete from public.partner_capacity_overrides
    where partner_id = target_partner_id
      and capacity_date >= local_today;

    insert into public.partner_capacity_overrides (partner_id, capacity_date, capacity, note)
    select
        target_partner_id,
        entry."date"::date,
        entry.capacity,
        nullif(btrim(entry.note), '')
    from jsonb_to_recordset(overrides) as entry("date" text, capacity integer, note text);

    -- Apply the new limit to existing future windows. A blocked window remains
    -- blocked for its independent schedule or closure reason.
    with effective as (
        select
            slot.id,
            coalesce(override.capacity, default_capacity) as capacity
        from public.slots slot
        left join public.partner_capacity_overrides override
          on override.partner_id = slot.partner_id
         and override.capacity_date = timezone(zone, slot.starts_at)::date
        where slot.partner_id = target_partner_id
          and slot.starts_at > now()
    )
    update public.slots slot
    set capacity = effective.capacity,
        state = case
            when slot.state = 'blocked' then slot.state
            when slot.booked >= effective.capacity then 'full'::public.slot_state
            else 'open'::public.slot_state
        end
    from effective
    where slot.id = effective.id;

    -- Dates beyond today's materialized horizon are stored for the scheduled
    -- generator; missing windows inside the horizon are safely filled now.
    perform public.generate_slots(target_partner_id, local_today, 14);
end;
$$ language plpgsql volatile security definer set search_path = public, pg_temp;

revoke all on function public.replace_partner_capacity_overrides(text, jsonb) from public;
grant execute on function public.replace_partner_capacity_overrides(text, jsonb) to authenticated;
