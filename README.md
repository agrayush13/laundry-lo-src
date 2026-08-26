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

- **React 18 + TypeScript**, bundled with **Webpack 5**
- Routing: react-router-dom v7; styling: SCSS Modules; icons: lucide-react
- State: React context, no state library
- Tooling: ESLint, Prettier, Stylelint, Vitest
- Deployed on Netlify
- Demo data is seeded client-side, so no real orders are placed

## Roadmap

- **The homepage is being rebuilt as one wash cycle** - scroll position drives
  wash → rinse → spin → dry → fold → deliver, one viewport per phase. Design and
  build decisions live in [docs/journey.md](docs/journey.md).
- Real backend on Supabase, against [docs/api-contract.md](docs/api-contract.md)
- Payments, partner admin panel, written reviews

## Docs

Start at [docs/](docs/). The PRD says what we are building, the homepage doc
covers the creative front door, and the architecture doc explains how it is put
together.

## Running locally

The frontend lives in the [`ui/`](ui/) folder.

```bash
cd ui
npm install
npm run dev      # dev server at http://localhost:3000
```

Other scripts:

```bash
npm run build         # production bundle → ui/dist
npm run check         # typecheck, lint, styles, format, tests, build
npm run lint          # ESLint
npm run format        # Prettier (write)
npm run typecheck     # tsc --noEmit
```
