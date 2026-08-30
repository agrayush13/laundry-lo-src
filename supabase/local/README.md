# Running the schema without Docker

`npm run db:start` brings up the real Supabase stack and is what you want most of
the time. It needs a container runtime.

This directory is the fallback: enough of a shim to run the migrations, the seed
and the API suite against a plain Postgres. It exists because until they run
somewhere, nothing in `supabase/migrations` has ever executed, and a migration
nobody has applied is a guess.

## What the shim provides

`00_supabase_shim.sql` creates only the objects the migrations reference by name:

- the `anon`, `authenticated` and `service_role` roles, granted to `postgres` so
  `set local role` works the way `api/src/db/pool.ts` needs;
- the `auth` schema and `auth.users`, which `profiles.id` references and
  `handle_new_user` triggers off;
- `auth.uid()` and `auth.role()`, reading the same `request.jwt.claims` setting
  the API populates.

It is not an emulation of GoTrue. Anything that needs a token actually issued -
sign-up, OAuth, refresh, the JWKS path - still needs the real stack.

## Setup

```bash
brew install postgresql@17
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"

# 54322 is the port the project's DATABASE_URL already expects.
pg_ctl -D /opt/homebrew/var/postgresql@17 -o "-p 54322" -l /tmp/pg.log start
psql -p 54322 -d postgres -c "create role postgres login superuser password 'postgres'"

npm run db:local:reset   # shim, then migrations, then seed
cd api && npm test
```

`db:local:reset` is destructive in the same way `supabase db reset` is: it drops
the public schema first.

## Where it differs from the real stack

- The server timezone is the machine's, not UTC. Slot seeding and the API both
  resolve the calendar date explicitly in `Asia/Kolkata`, so do the same in any
  new date-based seed logic.
- `postgres` here is a true superuser. In hosted Supabase it is not. Both assume
  `anon` / `authenticated` correctly, so RLS behaves the same, but do not rely on
  this cluster to tell you whether a privileged operation would be allowed.
