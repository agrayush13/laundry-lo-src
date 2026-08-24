# laundrylo - architecture

Status: **living document**. Describes the frontend as built, and the backend as
planned. Pairs with [api-contract.md](./api-contract.md) and
[schema.md](./schema.md).

---

## 1. Shape

Production origin: **https://laundrylo.com**

```
                 ┌──────────────────────────────┐
   Browser ────► │  React SPA (static hosting)  │
                 │  laundrylo.com, SPA rewrites │
                 └──────────┬───────────────────┘
                            │  fetch, Bearer <supabase jwt>
                 ┌──────────▼───────────────────┐
                 │  API  /api/v1                │
                 │  verifies JWT -> auth.uid()  │
                 └──────────┬───────────────────┘
                            │
                 ┌──────────▼───────────────────┐
                 │  Supabase                    │
                 │  Postgres + Auth + Storage   │
                 └──────────────────────────────┘
```

The frontend is a static bundle - no server rendering. Anything dynamic is an
API call. Identity is delegated entirely to Supabase Auth.

## 2. Frontend

### Stack

React 18 + TypeScript, bundled with Webpack 5. Routing is react-router-dom v7,
styling is SCSS Modules, icons are lucide-react. No state library - React context
covers what we need.

The homepage adds GSAP with ScrollTrigger and Lenis, and a self-hosted Fraunces
variable font. All three are scoped to `/`: they load after first paint and never
enter an app route's payload.

### Directory layout

```
ui/src/
  common-ui/     reusable presentational components, one folder each
  pages/         route-level screens, grouped by feature
  hooks/         all logic; components stay JSX-only
  context/       Auth, Cart, Theme providers
  config/        copy, routes, tokens, tunables - no literals in components
  models/        shared TypeScript types
  data/          seed data; deleted once services exist
  utils/         pure helpers
  styles/        shared SCSS mixins and tokens
  __tests__/     integration tests
```

Naming: components PascalCase, directories kebab-case, styles
`<name>.module.scss` with camelCase class exports, helpers `xUtils.ts`, config
`xConfig.ts`, and future API callers `xServices.ts`.

### The rules that shape the code

- **TSX files contain JSX only.** Every non-trivial decision lives in a hook -
  `useCheckoutForm`, `usePartnerListing`, `usePinCodeSearch`. This is why the
  pages are small and the hooks are where the behaviour is.
- **No hardcoded copy, colours, fonts or data in components.** Copy and tunables
  live in `config/`, design tokens in CSS custom properties.
- **Theming is runtime.** Light and dark are CSS custom property sets; Sass
  variables alias `var(--*)` so a single toggle re-themes everything without a
  rebuild. The homepage is the one exception: it pins itself to the paper theme
  and hides the toggle, because a dark wash cycle is not a variant of the design,
  it is a different design.

### State

| Concern | Where it lives | Persistence                                                |
| ------- | -------------- | ---------------------------------------------------------- |
| Cart    | `CartContext`  | `localStorage`, versioned, cleared on order placement      |
| Auth    | `AuthContext`  | `localStorage` today; moves to Supabase's session handling |
| Theme   | `ThemeContext` | `localStorage`                                             |

The cart is versioned (`STORAGE_VERSION`) so a shape change discards stale data
rather than letting it reach components, and all reads are wrapped in try/catch
because private browsing can reject storage.

Once the API lands, `CartContext` loses its tax arithmetic and becomes a thin
cache over server-computed totals.

### Routing and loading

The homepage ships in the initial bundle; every other route is `React.lazy`
behind a Suspense boundary in `Layout`. Webpack `splitChunks` separates vendor
code. Protected routes (`profile`, `bookings`) sit behind a `ProtectedRoute`
wrapper.

`Layout` renders the shared header and footer for every route except `/`. The
homepage carries its own minimal header and its own footer, which is the last
phase of the cycle rather than a component bolted underneath it.

Because it is an SPA on static hosting, deep links need rewrite rules -
`_redirects` sends everything to `index.html`, without which `/cart` 404s on
refresh.

### The homepage scroll spine

The homepage is six sections, each exactly one viewport, driven by scroll
position. Three things make that affordable:

- **Only the hero is eager.** The hero and the spine ship in the initial bundle.
  Sections 2 to 6 are dynamic imports, prefetched one section ahead by an
  IntersectionObserver. Each unloaded section still reserves 100vh, so the
  scrollbar never lies and nothing jumps as chunks arrive; `ScrollTrigger.refresh()`
  runs after each one mounts.
- **Motion is compositor only.** transform, opacity and clip-path, with no
  layout-affecting animation and no CSS filter blur while anything moves. Blur is
  faked with skew, stretch and opacity ghosts, because a real blur on a moving
  layer costs a repaint per frame.
- **Rest states are static HTML.** Every section renders its complete final
  content before any JavaScript runs, which is what makes
  `prefers-reduced-motion` a matter of not starting the animations rather than a
  separate code path.

Deterministic choreography is scrubbed against scroll position and reverses;
ambient effects (droplets, bubbles, sway, steam) respond to absolute velocity and
never rewind. [homepage.md](./homepage.md) is the reference for both.

Lenis owns the scroll on `/` and is torn down on navigation, so app routes keep
native scrolling and `useScrollToTop` behaves.

### Static assets and social previews

Brand assets (`laundrylo-logo.svg`, `laundrylo-mark.svg`,
`laundrylo-appicon-v2.svg`, `laundrylo-washer.svg`) live in `ui/src/assets/` and
are the reference artwork: the built machine, header wordmark, progress dial and
loader must match them rather than being redrawn. They are imported through
webpack's asset pipeline, and inlined into the DOM where their parts need to
animate.

`public/` is copied verbatim into the build by a small webpack plugin, with
filenames left unhashed. That matters for `og-image.png`: the page head points at
`https://laundrylo.com/og-image.png` as an absolute URL, because crawlers do not
run JavaScript and resolve nothing relative, so a content hash would break every
social preview on each deploy.

The preview card is generated from `ui/tools/og-image.html` - a standalone page
using the brand tokens and wordmark, rendered headless at exactly 1200x630. The
source is kept in the repo so the card can be regenerated when the brand or
strapline changes, rather than being an orphaned binary.

### Error handling

A class-component error boundary wraps the app and renders a branded fallback
rather than a blank page. It uses the same design tokens as the rest of the app,
so a crash still looks like laundrylo.

### Testing

Vitest + Testing Library, integration-first: tests drive real user journeys
(add to cart -> checkout -> confirm) rather than asserting on internals.
`npm run check` runs typecheck, eslint, stylelint, prettier, tests **and the
production build** - the build is in there because a css-loader misconfiguration
once shipped a blank page that every other check passed.

Automated checks do not catch visual or scroll regressions. Browser verification
via the Chrome DevTools Protocol is used for anything positional.

That gap is widest on the homepage: happy-dom has no layout, so ScrollTrigger and
the physics never run under test. Homepage tests assert the static rest state,
the reduced-motion render and the links, which is exactly the content parity the
design requires anyway. Motion is verified in a browser.

## 3. Backend (planned)

### Why Supabase

Postgres, auth, storage and a free tier in one place. Auth is the deciding
factor: it gives short-lived access JWTs, automatic refresh rotation, OAuth
providers, and revocation at the refresh-token layer, none of which we want to
build. See [api-contract.md](./api-contract.md) decision 4.

### Request path

1. Client attaches `Authorization: Bearer <supabase access token>`.
2. API verifies the token against Supabase's JWKS.
3. `auth.uid()` identifies the caller; Row Level Security enforces ownership at
   the database rather than trusting application code.

### What the server owns, non-negotiably

- **Money.** Subtotals, tax, delivery fees and membership discounts are computed
  server-side and returned. The client renders what it is given.
- **Availability.** Slot capacity, partner hours and holidays. Booking increments
  the slot count inside the order transaction, so `409 SLOT_UNAVAILABLE` is
  truthful under concurrency.
- **`isOpen`.** Manual toggle plus optional auto-scheduling from opening hours.
- **Order history.** Item names, prices and addresses are snapshotted onto the
  order at placement so later edits never rewrite the past.

### What the client owns

- All presentation: labels, formatting, locale, `done/current/pending` states in
  the timeline. The API sends events that happened; the client decides how they
  read. That way copy changes never need a backend deploy.

### Idempotency

`POST /orders` carries a client-generated `Idempotency-Key`, unique per user in
the database. A replay returns the original order, so a double-tapped Place Order
cannot create two orders.

## 4. Migration path

The UI currently runs on seed data in `ui/src/data/`. The route to a real
backend, in order:

1. **Agree the contract.** Done - see [api-contract.md](./api-contract.md).
2. **Mock it with MSW** against that exact shape. The UI gets loading, empty and
   error states, and reshapes to per-item pricing, without waiting for a server.
3. **Introduce `services/*Services.ts`** as the only place that talks to the
   network. Components and hooks call services, never `fetch` directly.
4. **Build the backend** against the same contract; flip MSW off.
5. **Delete `data/*.ts`.**

Step 2 is the leverage point: it flushes out every missing state while the
contract is still cheap to change.

## 5. Known gaps

- No analytics, no error reporting service.
- No partner admin panel, so `is_open`, hours and catalogs have no editor.
- Images are Unsplash URLs rather than owned assets.
- Cash on pickup only; no payment integration.
