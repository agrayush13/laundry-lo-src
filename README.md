# laundrylo 🧺

Laundry pickup & delivery, marketplace-style. Think Zomato, but for laundry.

**Live → [laundrylo.com](https://laundrylo.com)**

## What it is

Local laundries are fragmented and offline. laundrylo puts them on one platform:

1. **Book** a pickup slot from a partner laundry near you
2. **Pickup** - the platform's delivery fleet collects from your door
3. **Clean** - the partnered laundry handles the wash
4. **Deliver** - clothes come back to your door

This repo is seeded with demo data for Bengaluru.

## Features

- Browse partner laundries with filters
- Cart-led booking flow (items → address → slots → confirm)
- My Bookings, order status tracking
- Auth & profile
- laundrylo Plus membership

## Stack

**Frontend**

- **React 18 + TypeScript**, bundled with **Webpack 5**
- Routing: react-router-dom v7; styling: SCSS Modules; icons: lucide-react
- State: React context, no state library
- Tooling: ESLint, Prettier, Stylelint, Vitest
- Deployed on Netlify
- Orders and the signed-in user are still seeded client-side, so no real orders are placed

**Backend**

- **Node + TypeScript** on Hono, in [`api/`](api/), serving `/api/v1`
- **Postgres on Supabase**, migrations and seed in [`supabase/`](supabase/)
- Auth delegated to Supabase; the API only verifies the access token
- Row Level Security on every table, and the API assumes the caller's role
  rather than bypassing it

## Roadmap

- **The cycle**, at `/journey`: scroll position drives
  wash → rinse → spin → dry → fold → deliver, one pinned phase at a time. Built,
  and deliberately not linked from the app, so it is reachable by URL only. The
  marketing homepage stays the product surface and the two read their shared
  figures from one source. Design and build decisions live in
  [docs/journey.md](docs/journey.md).
- **Backend, in progress.** Schema and the read path (partners, catalogue, slots)
  are built against [docs/api-contract.md](docs/api-contract.md), and the app
  reads them: the listing, partner pages and checkout slots all come from the
  API. Cart, orders and profile are next.
- Payments, partner admin panel, written reviews

## Docs

Start at [docs/](docs/). The PRD says what we are building, the journey doc
covers the cycle, the architecture doc explains how it is put together, and the
worklog records what was done and what was learned doing it.

## Running locally

### Frontend

The frontend lives in the [`ui/`](ui/) folder. Marketing content, account data
and demo orders are local fixtures; partner listings, catalogues and slots use
the API.

```bash
cd ui
npm install
npm run dev      # dev server at http://localhost:3000
```

Browsing laundries, opening one and picking a slot all call the API, so the
database and API below need to be running too. The dev server proxies `/api` to
`http://localhost:8787`, which keeps the browser out of CORS.

### Database and API

The database needs Docker running. From the repo root:

```bash
npm install
npm run db:start      # supabase start
npm run db:reset      # migrations, then seed data
```

Then the API:

```bash
cd api
npm install
cp .env.example .env  # defaults match the local Supabase stack
npm run dev           # http://localhost:8787
npm test              # integration tests against the seeded database
```

`npm run db:status` prints the local stack's URLs and keys. Supabase Studio runs
at http://localhost:54323.

Other scripts:

```bash
npm run build         # production bundle → ui/dist
npm run check         # typecheck, lint, styles, format, tests, build
npm run lint          # ESLint
npm run format        # Prettier (write)
npm run typecheck     # tsc --noEmit
```
