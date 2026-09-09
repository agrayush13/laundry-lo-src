-- Owner-managed laundry configuration. The original RLS policies already
-- restrict rows to partners.owner_id = auth.uid(); this migration supplies the
-- missing column-level privileges and keeps schedule replacement atomic.

alter table public.partners
    add constraint partners_name_length check (length(btrim(name)) between 1 and 120),
    add constraint partners_line1_length check (length(btrim(line1)) between 1 and 160),
    add constraint partners_city_length check (length(btrim(city)) between 1 and 80),
    add constraint partners_about_length check (about is null or length(about) <= 1000),
    add constraint partners_line2_length check (length(line2) <= 160),
    add constraint partners_turnaround_max check (turnaround_hours <= 336);

-- Older imports were allowed to omit closed weekdays. The settings contract is
-- a complete calendar, so make the read shape consistent before owners edit it.
insert into public.partner_hours (partner_id, weekday, opens_at, closes_at)
select partner.id, weekday::smallint, null, null
from public.partners partner
cross join generate_series(0, 6) as weekday
on conflict (partner_id, weekday) do nothing;

grant update (
    name,
    about,
    line1,
    line2,
    city,
    pincode,
    turnaround_hours,
    is_open,
    auto_schedule
) on public.partners to authenticated;

create or replace function public.replace_partner_hours(
    target_partner_id text,
    schedule jsonb
) returns void as $$
declare
    schedule_valid boolean;
    schedule_changed boolean;
begin
    if not public.owns_partner(target_partner_id) then
        raise exception 'PARTNER_NOT_FOUND';
    end if;

    if jsonb_typeof(schedule) is distinct from 'array' then
        raise exception 'PARTNER_HOURS_INVALID';
    end if;

    select
        count(*) = 7
        and count(distinct weekday) = 7
        and min(weekday) = 0
        and max(weekday) = 6
        and bool_and((opens_at is null) = (closes_at is null))
        and bool_and(opens_at is null or opens_at < closes_at)
    into schedule_valid
    from (
        select
            entry.weekday,
            entry."opensAt"::time as opens_at,
            entry."closesAt"::time as closes_at
        from jsonb_to_recordset(schedule) as entry(
            weekday smallint,
            "opensAt" text,
            "closesAt" text
        )
    ) parsed;

    if schedule_valid is not true then
        raise exception 'PARTNER_HOURS_INVALID';
    end if;

    -- Saving an unchanged profile must not disturb capacity for orders that
    -- are already booked. Only rebuild future slots when the schedule itself
    -- differs from the stored seven-day calendar.
    select exists (
        (
            select weekday, opens_at, closes_at
            from public.partner_hours
            where partner_id = target_partner_id
            except
            select
                entry.weekday,
                entry."opensAt"::time,
                entry."closesAt"::time
            from jsonb_to_recordset(schedule) as entry(
                weekday smallint,
                "opensAt" text,
                "closesAt" text
            )
        )
        union all
        (
            select
                entry.weekday,
                entry."opensAt"::time,
                entry."closesAt"::time
            from jsonb_to_recordset(schedule) as entry(
                weekday smallint,
                "opensAt" text,
                "closesAt" text
            )
            except
            select weekday, opens_at, closes_at
            from public.partner_hours
            where partner_id = target_partner_id
        )
    ) into schedule_changed;

    if schedule_changed is not true then
        return;
    end if;

    delete from public.partner_hours where partner_id = target_partner_id;
    insert into public.partner_hours (partner_id, weekday, opens_at, closes_at)
    select
        target_partner_id,
        entry.weekday,
        entry."opensAt"::time,
        entry."closesAt"::time
    from jsonb_to_recordset(schedule) as entry(
        weekday smallint,
        "opensAt" text,
        "closesAt" text
    );

    -- Old, unbooked slots must not survive a changed schedule. Existing
    -- reservations remain referentially intact but are blocked from taking
    -- additional orders; the new 14-day window is then generated afresh.
    delete from public.slots
    where partner_id = target_partner_id
      and starts_at > now()
      and booked = 0;

    update public.slots
    set state = 'blocked'
    where partner_id = target_partner_id
      and starts_at > now()
      and booked > 0;

    perform public.generate_slots(
        target_partner_id,
        timezone('Asia/Kolkata', now())::date,
        14
    );
end;
$$ language plpgsql volatile security definer set search_path = public;

revoke all on function public.replace_partner_hours(text, jsonb) from public;
grant execute on function public.replace_partner_hours(text, jsonb) to authenticated;
