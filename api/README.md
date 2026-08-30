# laundrylo api

The `/api/v1` service from [docs/api-contract.md](../docs/api-contract.md). It
verifies Supabase access tokens, reads Supabase Postgres through Row Level
Security, and returns the contract's shapes: integer minor units for money, ISO
8601 UTC for times, one error envelope, cursor pagination. The write endpoints
in the contract are still planned.

## Running it

The database comes first. From the repo root:

```bash
npm install
npm run db:start      # supabase start - needs Docker running
npm run db:reset      # applies supabase/migrations, then supabase/seed.sql
```

Then the service:

```bash
cd api
npm install
cp .env.example .env  # defaults already match the local Supabase stack
npm run dev           # http://localhost:8787
npm test              # integration tests against the seeded database
```

`npm run check` runs typecheck, ESLint, format check, integration tests and the
production build. The tests need the database up; the other gates do not.

Without Docker, `supabase/local/` runs the same migrations and seed against a
plain Postgres - see [supabase/local/README.md](../supabase/local/README.md).
The shim covers the `auth` schema, `auth.uid()` and the `anon` / `authenticated`
roles; it does not cover Supabase Auth itself.

## Shape

```
src/
  index.ts        server bootstrap and graceful shutdown
  app.ts          middleware, routing, the error envelope
  config.ts       every environment value, resolved at boot
  models.ts       the wire shapes, mirroring ui/src/models
  auth/           Supabase token verification (JWKS or local shared secret)
  db/             connection pool, and the RLS session wrapper
  http/           errors, money, cursors, validation, serializers
  queries/        SQL, one function per query
  routes/         one file per resource
tests/            integration tests, driven through app.request
```

Rows never reach a route handler in their storage shape: `http/serializers.ts`
is the single place snake_case columns become the contract's camelCase, so a
column rename cannot reach the client.

## Row Level Security

Every table has RLS on, and the service does not sidestep it. `db/pool.ts`
exposes `asCaller`, which opens a transaction, sets `request.jwt.claims` and
assumes the `anon` or `authenticated` role before running the query. A handler
that forgets an ownership check therefore returns nothing rather than someone
else's data. `set local` scopes both to the transaction, so a pooled connection
cannot leak one request's identity into the next.

The local `.env` connects as `postgres` for the shim. Production must use a
dedicated low-privilege login that can assume only the intended API roles; an
owner connection would make a missed `asCaller` call an RLS bypass.

## Endpoints

| Method | Path                            | Notes                                                                            |
| ------ | ------------------------------- | -------------------------------------------------------------------------------- |
| GET    | `/health`                       | Fails when Postgres is unreachable                                               |
| GET    | `/api/v1/partners`              | `pincode`, `services`, `tags`, `sort`, `limit`, `cursor`, `latitude`/`longitude` |
| GET    | `/api/v1/partners/{id}`         | Adds `about` and `openingHours`                                                  |
| GET    | `/api/v1/partners/{id}/catalog` | Per-partner categories and items                                                 |
| GET    | `/api/v1/partners/{id}/slots`   | `from` (YYYY-MM-DD), `days` (1-14)                                               |

`services=` and `tags=` are conjunctive - `services=wash-fold,dry-cleaning`
matches partners offering both - and accept either a comma list or a repeated
parameter.

Still to build, in contract order: `/me`, `/addresses`, `/cart` with
server-computed totals, `POST /orders` with idempotency and slot booking, and
`/membership`.
