# laundrylo API contract

Status: **implemented and consumed**. Supabase Auth is the deployed identity
provider; the API serves the public marketplace and authenticated customer
resources described here.

Public partner, catalogue, slot and membership-plan reads need no token.
Profiles, addresses, carts, order placement/history and current membership use
the verified Supabase caller. No production resource falls back to bundled
data; local order/user arrays exist only behind the browser-test fixture.

Base URL: `/api/v1`

---

## 1. Conventions

### Identifiers

Opaque strings, never sequential integers in URLs. Partner ids are already
strings (`"1001"`); treat them as opaque so they can become ULIDs later without
a client change.

### Money

**Integer minor units (paise) plus a currency code.** Never floats.

```json
{ "amount": 4900, "currency": "INR" }
```

`4900` is ₹49.00. The UI formats through a single `Money` component. Rationale: `0.1 + 0.2` problems in tax and totals are
otherwise guaranteed once discounts arrive.

### Dates and times

ISO 8601, UTC, always. **No pre-formatted display strings.** The client receives
`"2026-08-20T05:00:00Z"` and formats for the user's locale.

### Errors

One shape for every failure:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Pincode must be 6 digits.",
    "fields": { "pincode": "Must be 6 digits." },
    "requestId": "01J8..."
  }
}
```

`code` is a stable machine string the UI switches on. `message` is safe to show.
`fields` is present only for `VALIDATION_FAILED`. HTTP status still carries
meaning (400/401/403/404/409/422/429/500).

### Pagination

Cursor-based for anything unbounded:

```json
{ "data": [ ... ], "nextCursor": "eyJpZCI6..." }
```

`?limit=20&cursor=...`. Absent `nextCursor` means the end.

### Auth

Authenticated calls use `Authorization: Bearer <supabase access token>`. The
token is issued and refreshed by Supabase Auth; the API verifies it against
Supabase's JWKS. See section 2 and decision 5.

### Idempotency

`POST /orders` requires an `Idempotency-Key` header (client-generated UUID).
Replaying the same key returns the original order rather than creating a second
one. Without this, a double-tap on Place Order creates two orders.

---

## 2. Auth - delegated to Supabase Auth

We do **not** build our own auth. The production client uses Supabase Auth
directly; our API only _verifies_ the incoming access token.

### Why

- Short-lived access JWT + auto-rotated refresh token, handled by the client
  library. Revocation works at the refresh-token layer: sign-out (or "sign out
  everywhere") invalidates it, so the session cannot be renewed; the access JWT
  lives only until its short expiry.
- Email/password **and Google OAuth** use the provider's supported
  sign-in flows rather than application-owned credentials.
- Session storage follows the Supabase client model. If the frontend later moves
  to server-rendered delivery, `@supabase/ssr` can use httpOnly cookies.

### Client-side (no endpoints of ours)

- Register: `supabase.auth.signUp({ email, password })`
- Login: `supabase.auth.signInWithPassword({ email, password })` and surface the
  provider's invalid-credentials response without exposing account existence.
- Google: `supabase.auth.signInWithOAuth({ provider: 'google' })`
- Password reset: `supabase.auth.resetPasswordForEmail(email)` - always
  succeeds to the user regardless of account existence (no enumeration).
- Email confirmation and OAuth return through `/auth/callback`; password
  recovery returns through `/update-password` and calls `updateUser` only for a
  recovery session.
- Redirects use PKCE, so the browser receives a short-lived authorization code
  rather than access and refresh tokens in the callback URL.
- Session restore, automatic access-token refresh and sign-out are library
  calls. Normal sign-out is scoped to the current browser session. The client
  forwards the current access token to the API without storing a second
  application-owned session.

### Server-side (our API)

Every authenticated request carries `Authorization: Bearer <supabase access
token>`. The API verifies its signature, issuer, audience, authenticated role
and UUID subject against Supabase's JWKS, then reads the caller as `auth.uid()`.
No `/auth/*` routes of our own.

### Profile

Supabase owns the identity row (`auth.users`). We keep an app-level profile
keyed by the Supabase user id for fields Supabase does not model:

```json
{
  "id": "018f7fd2-00d8-7c71-9b24-53f617ef0b66",
  "fullName": "Demo Customer",
  "email": "customer@example.com",
  "phone": "+91 90000 00000",
  "memberSince": "2024-01-14T00:00:00Z",
  "preferences": { "sms": true, "email": false }
}
```

- `GET /me` → `200` this profile (created on first login if absent).
- `PATCH /me` → `200` updates app-level name, phone and preferences. Email
  changes continue through Supabase Auth so confirmation policy stays with the
  identity provider.

Note: **addresses are no longer embedded**. They are their own resource, so
adding one does not require re-fetching the profile.

---

## 3. Partners

### `GET /partners?pincode=560103&services=wash-fold&tags=free-pickup&sort=rating&limit=20`

```json
{
  "data": [
    {
      "id": "1001",
      "name": "SparkleWash Express",
      "rating": 4.9,
      "reviewCount": 234,
      "address": {
        "line1": "12, MG Road",
        "line2": "Sector 5",
        "city": "Bengaluru",
        "pincode": "560103"
      },
      "distanceMeters": 800,
      "tags": ["free-pickup", "eco-friendly"],
      "services": ["wash-fold", "wash-iron", "dry-cleaning"],
      "turnaroundHours": 24,
      "startingPrice": { "amount": 2000, "currency": "INR", "unit": "piece" },
      "isOpen": true,
      "image": {
        "url": "https://cdn.../sparklewash.jpg",
        "alt": "Front-loading washing machines"
      }
    }
  ],
  "nextCursor": null
}
```

Changes from the original mock, all deliberate and now reflected in the client:

| Previous fixture                   | Contract                | Why                                                                                 |
| ---------------------------------- | ----------------------- | ----------------------------------------------------------------------------------- |
| `distanceKm: 0.8`                  | `distanceMeters: 800`   | Integer; and it is a property of _this search_, not of the partner                  |
| `tags: ["Free Pickup"]`            | `tags: ["free-pickup"]` | Slugs are stable; display names are the client's business and are already in config |
| `address: "12, MG Road, Sector 5"` | structured object       | Needed for map pins and sorting later                                               |
| `startingPrice: 49`                | money object with unit  | Currency and units become explicit                                                  |

`services` lists the catalogue category slugs the partner actually offers, so the
listing can be filtered by service without fetching every catalogue. `services=`
takes one or more slugs and matches partners offering **all** of them, the same
conjunctive rule as `tags=`. The homepage service cards are the first caller: each
card links to `/laundries?pin=560103&service=wash-fold`. See decision 7.

`isOpen` is stored server-side and controlled by partner operations. See decision 2.

`sort=distance` requires either `pincode` or a latitude/longitude pair. Without
an origin there is no meaningful distance to sort, so the API returns `422`
instead of presenting a stable-looking but arbitrary order.

### `GET /partners/{id}`

→ `200` the same object, plus `openingHours` and `about`.
→ `404` `{ "error": { "code": "PARTNER_NOT_FOUND" } }`; the UI renders a
dedicated not-found state.

### `GET /partners/{id}/catalog`

```json
{
  "categories": [
    {
      "id": "cat_1001_wash-fold",
      "service": "wash-fold",
      "name": "Wash & Fold",
      "items": [
        {
          "id": "wf-shirt",
          "name": "Shirt / T-shirt",
          "description": "Machine wash with premium detergent, neatly folded",
          "price": { "amount": 2000, "currency": "INR" },
          "unit": "piece",
          "iconKey": "shirt"
        },
        {
          "id": "wf-trousers",
          "name": "Trousers / Jeans",
          "price": { "amount": 3000, "currency": "INR" },
          "unit": "piece",
          "iconKey": "box"
        }
      ]
    }
  ]
}
```

**Pricing is per item.** Every catalog item carries a fixed `price` and a `unit`,
so the total is fully known at checkout - there is no weigh-after-pickup estimate
flow. The service is encoded in the item: a "Wash & Fold - Shirt" and a
"Dry Clean - Shirt" are different items at different prices, which is why coarse
garment buckets (Shirt/T-shirt, Trousers/Jeans, Bedsheet, Towel...) live under
per-service categories rather than one shared menu.

`unit` enum: `piece | bag | kg`. **Launch ships `piece` only.** `bag` (a real
fixed-capacity branded bag, priced flat) and `kg` (needs weighing) stay in the
enum so they can return later with no schema change, once operations support
them honestly. See decision 5.

`iconKey` keeps presentation out of storage. The client maps the stable key onto
its icon registry, avoiding platform-dependent emoji rendering.

**Catalogue is per partner**. The same garment can therefore have different
prices and descriptions at different laundries.

A category carries both `service` and `name`: `service` is the platform's slug,
which is what `services=` filters on, and `name` is the partner's own wording.
Royal Dry Cleaners calls its category "Express Dry Clean" and still answers
`services=dry-cleaning`. The four slugs are `wash-fold`, `wash-iron`,
`dry-cleaning` and `premium-care`, matching `ServiceId` in the client.

`startingPrice` on a partner is **derived**, not stored: it is the cheapest
active item in that partner's catalogue. A partner therefore cannot advertise a
starting price its catalogue does not actually offer.

---

## 4. Addresses

- `GET /addresses` → `{ "data": [SavedAddress] }`
- `POST /addresses` → `201` `SavedAddress`
- `PATCH /addresses/{id}` → `200`
- `DELETE /addresses/{id}` → `204`

```json
{
  "id": "adr_01J8",
  "label": "Home",
  "recipientName": "Ayush Agrawal",
  "phone": "+91 98765 43210",
  "building": "42",
  "street": "Sector 5, HSR Layout, Bengaluru",
  "landmark": "",
  "pincode": "560103",
  "isDefault": true
}
```

`fullName` renamed to `recipientName` - it is who receives the delivery, not
necessarily the account holder.

---

## 5. Slots

### `GET /partners/{id}/slots?from=2026-07-19&days=7`

```json
{
  "days": [
    {
      "date": "2026-07-19",
      "slots": [
        {
          "id": "slt_0800",
          "startsAt": "2026-07-19T02:30:00Z",
          "endsAt": "2026-07-19T04:30:00Z",
          "available": true
        },
        {
          "id": "slt_1000",
          "startsAt": "2026-07-19T04:30:00Z",
          "endsAt": "2026-07-19T06:30:00Z",
          "available": false
        }
      ]
    }
  ]
}
```

Slots come from the server because capacity, partner hours and holidays live
there. The client uses the opaque slot id as identity and renders
`available: false` as unselectable.

---

## 6. Cart

- `GET /cart` → `Cart`
- `PUT /cart/items/{itemId}` `{ "quantity": 3 }` → `Cart` (quantity `0` removes)
- `POST /cart/membership` / `DELETE /cart/membership` → `Cart`
- `DELETE /cart` → `204`

```json
{
  "id": "crt_01J8",
  "partner": { "id": "1001", "name": "SparkleWash Express" },
  "items": [
    {
      "itemId": "wf-shirt",
      "name": "Shirt / T-shirt",
      "description": "Machine washed with premium detergent, neatly folded",
      "categoryName": "Wash & Fold",
      "iconKey": "shirt",
      "quantity": 3,
      "unit": "piece",
      "unitPrice": { "amount": 2000, "currency": "INR" },
      "lineTotal": { "amount": 6000, "currency": "INR" }
    }
  ],
  "membership": {
    "plan": "plus",
    "price": { "amount": 9900, "currency": "INR" },
    "period": "month"
  },
  "totals": {
    "subtotal": { "amount": 6000, "currency": "INR" },
    "delivery": { "amount": 0, "currency": "INR" },
    "membership": { "amount": 9900, "currency": "INR" },
    "discount": { "amount": 600, "currency": "INR" },
    "tax": { "amount": 2754, "currency": "INR" },
    "total": { "amount": 18054, "currency": "INR" }
  }
}
```

**Totals are computed server-side and returned.** The authenticated client uses
these values directly; guest carts show an estimate until they are merged into
the server cart at sign-in.

A cart holds one partner's items. Adding from another partner returns `409
CART_PARTNER_CONFLICT` and the UI asks before replacing.

---

## 7. Orders

### `POST /orders`

Header: `Idempotency-Key: <uuid>`

```json
{
  "cartId": "crt_01J8",
  "addressId": "adr_01J8",
  "pickupSlotId": "slt_0800",
  "deliverySlotId": "slt_1800",
  "paymentMethod": "cash_on_pickup"
}
```

→ `201` `Order`
→ `200` the original `Order` when the same idempotency key is replayed
→ `409` `SLOT_UNAVAILABLE` if a slot filled between selection and submit
→ `409` `CART_CHANGED` if a cart line became inactive or no longer belongs
to the selected laundry. The cart is preserved so the UI can refresh it and ask
the customer to review the change.

### `GET /orders?limit=20&cursor=...` → `{ "data": [OrderSummary], "nextCursor": ... }`

### `GET /orders/{id}` → `Order`

```json
{
  "id": "ord_01J8XR3K2W",
  "reference": "LL-2026-001",
  "status": "processing",
  "placedAt": "2024-03-20T10:30:00Z",
  "partner": { "id": "1001", "name": "SparkleWash Express" },
  "lines": [
    {
      "itemId": "wf-shirt",
      "name": "Shirt / T-shirt",
      "quantity": 5,
      "unit": "piece",
      "amount": { "amount": 10000, "currency": "INR" }
    }
  ],
  "totals": {
    "subtotal": { "amount": 10000, "currency": "INR" },
    "delivery": { "amount": 0, "currency": "INR" },
    "membership": { "amount": 0, "currency": "INR" },
    "discount": { "amount": 0, "currency": "INR" },
    "tax": { "amount": 1800, "currency": "INR" },
    "total": { "amount": 11800, "currency": "INR" }
  },
  "deliveryAddress": {
    "label": "Home",
    "building": "42",
    "street": "Sector 5, HSR Layout, Bengaluru",
    "pincode": "560103"
  },
  "pickup": { "date": "2024-03-20", "startsAt": "...", "endsAt": "..." },
  "delivery": { "date": "2024-03-22", "startsAt": "...", "endsAt": "..." },
  "events": [
    { "type": "placed", "occurredAt": "2024-03-20T10:30:00Z" },
    { "type": "confirmed", "occurredAt": "2024-03-20T10:45:00Z" },
    { "type": "picked_up", "occurredAt": "2024-03-20T14:00:00Z" }
  ]
}
```

The API sends _events that happened_; the client renders labels, formats times, and derives
done/current/pending from the last event plus the known sequence. That way
copy changes and translations do not need a backend deploy.

`status` values: `processing | out_for_delivery | delivered | cancelled`
(lowercase snake, not display strings).

---

## 8. Membership

- `GET /membership/plans` → plan, price, benefits
- `GET /me/membership` → current status, renewal date
- Purchase happens with the first service order carrying Plus in the cart, so
  no separate purchase endpoint or unfulfillable membership-only order exists.

The 10% discount is applied server-side in cart totals and snapshotted on the
order. Free-pickup and priority-capacity rules also belong server-side once
their operating policy is settled; UI copy must not invent an entitlement the
placement transaction does not enforce.

---

## 9. Decisions

Reviewed 2026-08-31.

### Settled

1. **Cart ownership → guest cart client-side, merged on login.** Cart stays in
   `localStorage` and works signed-out. On login, merge
   into the account: **guest cart wins on partner conflict** (replace the server
   cart, warn via `CART_PARTNER_CONFLICT`); if the partner matches, union the
   line items and take the higher quantity per item.
2. **`isOpen` → server-stored.** An admin panel will let partners toggle
   open/closed and opt into auto open/close by opening hours. Consequence: the
   partner list must not be cached hard on the client (short TTL or revalidate on
   detail) so a store that just closed stops taking orders promptly.
3. **Money → integer minor units (paise).**
4. **Order id → two fields.** Opaque non-guessable `id` (ULID, used in every URL
   and API call) plus a human-friendly display-only `reference` (`LL-2026-001`).
   Never look up by `reference`. Closes order enumeration and removes the need
   for a global atomic counter on the hot path.

5. **Token strategy → Supabase Auth.** The production client uses Supabase Auth directly
   (email/password + OAuth); our API only verifies the access JWT and reads
   `auth.uid()`. Revocation via refresh-token invalidation on sign-out;
   short-lived access token; httpOnly-cookie storage available via
   `@supabase/ssr`. Section 2 is rewritten around this - our own `/auth/*` routes
   are gone. Google sign-in uses `signInWithOAuth`.
6. **Pricing model → per item.** Every catalog item has a fixed price and a
   `unit`, so the total is known at checkout and the estimate/reweigh/"final
   price pending"/pay-later flow is deleted. `unit` enum is `piece | bag | kg`;
   **launch ships `piece` only**, with `bag` and `kg` reserved for later with no
   schema change. Follow-up: the footer copy "you only pay once your laundry has
   been weighed" must change.

7. **Listing filters by service.** `Partner` carries a `services` array of
   catalogue category slugs, and `GET /partners` accepts `services=`. The
   alternative, deriving it by joining every partner's catalogue at query time,
   makes the cheapest and most common query on the site pay for the rarest need.
   The array is derived from `catalog_categories.service` server-side, so it
   cannot drift from what the partner actually sells. This is implemented in
   the `partner_details` view and consumed by the listing.

### Deferred (revisit later)

8. **Reviews.** `rating`/`reviewCount` stay read-only for now; write endpoints
   designed later.

- **Order chat** with the partner (placeholder today).
- **Map view** of partners (placeholder today).

---

## 10. Client rollout

Implemented:

- List and detail screens render loading, empty and retryable error states.
- `services/*Services.ts` is the only network boundary for partners, catalogues
  and slots.
- The listing reads its service filter from the query string, so a homepage card
  and a filter chip are the same state.
- Timeline labels and state are derived by the client from domain events.
- `CartContext` keeps a versioned guest cart, merges it at sign-in and then
  caches server-computed totals.
- `useCheckoutForm` submits `POST /orders` with a stable idempotency key and
  surfaces `409 SLOT_UNAVAILABLE` without losing the cart.
- Profile, address, order and membership screens use authenticated endpoints;
  local arrays are browser-test fixtures only.
