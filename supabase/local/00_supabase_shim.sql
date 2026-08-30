-- Everything the migrations depend on that hosted Supabase provides for free.
--
-- `supabase start` brings up the real thing and this file is not used. It exists
-- so the schema, the seed and the API suite can be run against a plain Postgres
-- - in CI, or on a machine without a container runtime - because until they run
-- somewhere, none of the SQL in supabase/migrations has ever executed.
--
-- Deliberately the minimum: the objects the migrations reference by name, and
-- nothing else. It is not an emulation of GoTrue. Anything that needs a real
-- token issued and verified still needs the real stack.

-- ---------------------------------------------------------------------------
-- Roles. PostgREST connects as `authenticator` and assumes one of these; our
-- API does the same thing from `db/pool.ts`. They cannot log in on their own.
-- ---------------------------------------------------------------------------

do $$
begin
    if not exists (select 1 from pg_roles where rolname = 'anon') then
        create role anon nologin noinherit;
    end if;
    if not exists (select 1 from pg_roles where rolname = 'authenticated') then
        create role authenticated nologin noinherit;
    end if;
    if not exists (select 1 from pg_roles where rolname = 'service_role') then
        create role service_role nologin noinherit bypassrls;
    end if;
end
$$;

grant anon, authenticated, service_role to postgres;

-- ---------------------------------------------------------------------------
-- The auth schema. `profiles.id` references auth.users, and handle_new_user
-- triggers off it.
-- ---------------------------------------------------------------------------

create schema if not exists auth;

create table if not exists auth.users (
    id                 uuid primary key default gen_random_uuid(),
    email              text unique,
    raw_user_meta_data jsonb not null default '{}'::jsonb,
    created_at         timestamptz not null default now()
);

grant usage on schema auth to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- auth.uid(), which every RLS policy is written against. Reads the claims the
-- API sets with `set_config('request.jwt.claims', ..., true)`, exactly as the
-- hosted definition does.
-- ---------------------------------------------------------------------------

create or replace function auth.uid() returns uuid as $$
    select coalesce(
        nullif(current_setting('request.jwt.claim.sub', true), ''),
        (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    )::uuid;
$$ language sql stable;

create or replace function auth.role() returns text as $$
    select coalesce(
        nullif(current_setting('request.jwt.claim.role', true), ''),
        (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
    );
$$ language sql stable;

grant execute on function auth.uid, auth.role to anon, authenticated, service_role;
