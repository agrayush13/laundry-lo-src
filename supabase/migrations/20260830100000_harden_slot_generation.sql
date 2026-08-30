-- Close two database-level gaps found after the read path was exercised:
-- overnight hours were accepted even though the slot generator cannot model
-- them, and its security-definer entry point was executable by PUBLIC.

alter table public.partner_hours
    add constraint partner_hours_ordered check (
        opens_at is null or closes_at > opens_at
    );

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

        select h.opens_at, h.closes_at into opens, closes
        from public.partner_hours h
        where h.partner_id = target_partner_id
          and h.weekday = extract(dow from day_date)::smallint;

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

revoke execute on function public.generate_slots(text, date, integer, integer, integer)
    from public, anon, authenticated;
grant execute on function public.generate_slots(text, date, integer, integer, integer)
    to service_role;
