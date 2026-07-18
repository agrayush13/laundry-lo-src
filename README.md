# LaundryLo 🧺

Laundry pickup & delivery, marketplace-style — think Zomato, but for laundry.

**Live demo → [laundrylo.netlify.app](https://laundrylo.netlify.app)**

## What it is

Local laundries are fragmented and offline. LaundryLo puts them on one platform:

1. **Book** a pickup slot from a partner laundry near you
2. **Pickup** — the platform's delivery fleet collects from your door
3. **Clean** — the partnered laundry handles the wash
4. **Deliver** — clothes come back to your door

This repo is seeded with demo data for Bengaluru.

## Features

- Browse partner laundries with filters
- Multi-step booking flow (service → address → schedule → summary)
- My Bookings — track order status
- Auth & profile

## Stack

- **React 18 + TypeScript**, bundled with **Webpack 5**
- Styling: plain CSS _(styling library TBD)_
- State management: _TBD_
- Tooling: ESLint + Prettier
- Deployed on Netlify
- Demo data is seeded client-side — no real orders are placed

## Roadmap

- **Next.js (SSR) rebuild in progress** — redesigning the site as an interactive scroll experience where the page itself runs like a wash cycle (wash → rinse → spin → dry → fold → deliver)
- Itemized billing with live estimates
- LaundryLo Plus membership (free pickup, priority slots)

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
npm run lint          # ESLint
npm run format        # Prettier (write)
npm run typecheck     # tsc --noEmit
```
