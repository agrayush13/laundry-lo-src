# laundrylo API

The `/api/v1` service from [docs/api-contract.md](../docs/api-contract.md). It
verifies Supabase access tokens, reads Supabase Postgres through Row Level
Security, and returns the contract's shapes: integer minor units for money, ISO
8601 UTC for times, one error envelope, cursor pagination. The write endpoints
in the contract are still planned.

The implemented routes are public reads. Supabase Auth issues and refreshes the
client session; this service verifies its access token and runs every request in
the matching Postgres RLS role. Authenticated write routes are added behind the
same boundary as their contract implementations land.

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
npm ci
cp .env.example .env  # safe defaults match this repository's local ports
npm run dev           # http://localhost:8787
npm test              # integration tests against the seeded database
```

`npm run check` runs typecheck, ESLint, format check, integration tests and the
production build. The tests need the database up; the other gates do not.

Without Docker, `supabase/local/` runs the same migrations and seed against a
plain Postgres - see [supabase/local/README.md](../supabase/local/README.md).
The shim covers the `auth` schema, `auth.uid()` and the `anon` / `authenticated`
roles; it does not cover Supabase Auth itself.

## Environment

| Variable              | Required   | Purpose                                                              |
| --------------------- | ---------- | -------------------------------------------------------------------- |
| `DATABASE_URL`        | yes        | PostgreSQL connection string; require TLS in production              |
| `SUPABASE_URL`        | yes        | Token issuer and hosted JWKS base URL                                |
| `SUPABASE_JWT_SECRET` | local only | Optional HS256 secret for a local stack; leave unset for hosted JWKS |
| `PORT`                | no         | HTTP port, default `8787`                                            |
| `CORS_ORIGINS`        | no         | Comma-separated browser origins, default `http://localhost:3000`     |
| `NODE_ENV`            | no         | Set to `production` in a deployment                                  |

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

## Deployment

The service is host-agnostic Node.js output:

```bash
npm ci
npm run build
npm start
```

`npm start` reads variables from the process environment supplied by the host;
it does not require a production `.env` file. `npm run dev` remains the local
command that reads `api/.env`.

For a production deployment:

1. Apply `supabase/migrations/` to hosted Supabase before starting a version of
   the API that depends on them. Do not load demo seed rows into real customer
   data unless that is an explicit environment decision.
2. Set `DATABASE_URL` to the dedicated API login and require TLS in the
   connection string. Set `SUPABASE_URL` to the hosted project URL and leave
   `SUPABASE_JWT_SECRET` unset so `jose` reads the rotating JWKS.
3. Set `NODE_ENV=production`, the platform-provided `PORT`, and
   `CORS_ORIGINS` only for browser origins that call the service directly.
4. Route the public origin's `/api/*` path to this service without stripping
   `/api`; the frontend deliberately has no environment-specific API base URL.
5. Use `/health` for readiness. It returns `503` when PostgreSQL is unavailable.

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
