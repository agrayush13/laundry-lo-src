# laundrylo API contract - draft for review

Status: **agreed**. The client's local seed data now matches these shapes, so
swapping in a real API is a transport change rather than a reshape. Still to do:
mock it (MSW), then implement the backend against it.

Not yet matching the client: totals are computed client-side because there is no
server to compute them, and Supabase Auth is designed but not wired.

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

`Authorization: Bearer <supabase access token>`. Issued and refreshed by Supabase
Auth; the API verifies it against Supabase's JWKS. See section 2 and decision 4.

### Idempotency

`POST /orders` requires an `Idempotency-Key` header (client-generated UUID).
Replaying the same key returns the original order rather than creating a second
one. Without this, a double-tap on Place Order creates two orders.

---

## 2. Auth - delegated to Supabase Auth

We do **not** build our own auth. The client uses Supabase Auth directly
(`@supabase/supabase-js`); our API only _verifies_ the incoming access token.

### Why

- Short-lived access JWT + auto-rotated refresh token, handled by the client
  library. Revocation works at the refresh-token layer: sign-out (or "sign out
  everywhere") invalidates it, so the session cannot be renewed; the access JWT
  lives only until its short expiry.
- Email/password **and OAuth** (Google, etc.) come built in, so the current
  "coming soon" Google button becomes real with `signInWithOAuth`.
- Token storage can be httpOnly cookies via `@supabase/ssr` instead of
  `localStorage`, closing the XSS exposure the mock had.

### Client-side (no endpoints of ours)

- Register: `supabase.auth.signUp({ email, password })`
- Login: `supabase.auth.signInWithPassword({ email, password })` -
  surfaces an invalid-credentials error the UI must handle (no such state today).
- Google: `supabase.auth.signInWithOAuth({ provider: 'google' })`
- Password reset: `supabase.auth.resetPasswordForEmail(email)` - always
  succeeds to the user regardless of account existence (no enumeration).
- Session restore on boot and sign-out are library calls.

### Server-side (our API)

Every request carries `Authorization: Bearer <supabase access token>`. The API
verifies it against Supabase's JWKS and reads the caller as `auth.uid()`. No
`/auth/*` routes of our own.

### Profile

Supabase owns the identity row (`auth.users`). We keep an app-level profile
keyed by the Supabase user id for fields Supabase does not model:

```json
{
    "id": "usr_01J8",
    "fullName": "Ayush Agrawal",
    "email": "ayush.agrawal@gmail.com",
    "phone": "+91 98765 43210",
    "memberSince": "2024-01-14T00:00:00Z",
    "preferences": { "sms": true, "email": false }
}
```

- `GET /me` → `200` this profile (created on first login if absent).
- `PATCH /me` → `200` updates the app-level fields.

Note: **addresses are no longer embedded**. They are their own resource, so
adding one does not require re-fetching the profile.

---

## 3. Partners

### `GET /partners?pincode=560103&tags=free-pickup,eco-friendly&sort=rating&limit=20`

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

| Today                              | Contract                | Why                                                                                 |
| ---------------------------------- | ----------------------- | ----------------------------------------------------------------------------------- |
| `distanceKm: 0.8`                  | `distanceMeters: 800`   | Integer; and it is a property of _this search_, not of the partner                  |
| `tags: ["Free Pickup"]`            | `tags: ["free-pickup"]` | Slugs are stable; display names are the client's business and are already in config |
| `address: "12, MG Road, Sector 5"` | structured object       | Needed for map pins and sorting later                                               |
| `startingPrice: 49`                | money object with unit  | Currency and units become explicit                                                  |

`isOpen` is stored server-side and toggleable from the admin panel. See decision 2.

### `GET /partners/{id}`

→ `200` the same object, plus `openingHours` and `about`.
→ `404` `{ "error": { "code": "PARTNER_NOT_FOUND" } }` - the UI currently
redirects silently; it should show a not-found state.

### `GET /partners/{id}/catalog`

```json
{
    "categories": [
        {
            "id": "wash-fold",
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

`iconKey` replaces the emoji currently sitting in the data (`"👕"`). Emoji are
presentation and render inconsistently across platforms; the client already has
an icon registry to map a key onto a glyph.

**Catalogue is per partner**, unlike today's mock where every partner shares one
menu and one price list.

---

## 4. Addresses

- `GET /addresses` → `{ "data": [SavedAddress] }`
- `POST /addresses` → `201` `SavedAddress`
- `PATCH /addresses/{id}` → `200` (the edit pencils in the profile are currently dead)
- `DELETE /addresses/{id}` → `204`

```json
{
    "id": "adr_01J8",
    "label": "Home",
    "recipientName": "Ayush Agrawal",
    "phone": "+91 98765 43210",
    "building": "42",
    "street": "Sector 15, Gurugram, Haryana",
    "landmark": "",
    "pincode": "122001",
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
                    "startsAt": "2026-07-19T08:00:00+05:30",
                    "endsAt": "2026-07-19T10:00:00+05:30",
                    "available": true
                },
                {
                    "id": "slt_1000",
                    "startsAt": "2026-07-19T10:00:00+05:30",
                    "endsAt": "2026-07-19T12:00:00+05:30",
                    "available": false
                }
            ]
        }
    ]
}
```

Today the client hardcodes six slot strings and treats `"8:00 AM - 10:00 AM"` as
the identity. Slots must come from the server: capacity, partner hours and
holidays all live there, and `available: false` is the only way the UI can stop
someone booking a full slot.

---

## 6. Cart

Assumes a **server-side cart** per open question 1.

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
        "tax": { "amount": 1080, "currency": "INR" },
        "total": { "amount": 7080, "currency": "INR" }
    }
}
```

**Totals are computed server-side and returned.** The client must not calculate
tax - it currently applies a hardcoded 18% in `CartContext`, which will drift
from the real rules the moment discounts or Plus benefits exist.

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
    "pickupDate": "2026-07-19",
    "deliverySlotId": "slt_1800",
    "deliveryDate": "2026-07-21",
    "paymentMethod": "cash_on_pickup"
}
```

→ `201` `Order`
→ `409` `SLOT_UNAVAILABLE` if the slot filled between selection and submit -
a real case the UI has no handling for.

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
        "tax": { "amount": 1800, "currency": "INR" },
        "total": { "amount": 11800, "currency": "INR" }
    },
    "deliveryAddress": {
        "label": "Home",
        "building": "42",
        "street": "Sector 15, Gurugram, Haryana",
        "pincode": "122001"
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

**The timeline is the biggest reshape.** Today the mock sends
`{ label: "Clothes Picked Up", detail: "Mar 20, 2:00 PM", state: "current" }` -
three presentation decisions baked into data. The API should send _events that
happened_; the client renders labels, formats times, and derives
done/current/pending from the last event plus the known sequence. That way
copy changes and translations do not need a backend deploy.

`status` values: `processing | out_for_delivery | delivered | cancelled`
(lowercase snake, not display strings).

---

## 8. Membership

- `GET /membership/plans` → plan, price, benefits
- `GET /me/membership` → current status, renewal date
- Purchase happens through the cart, so no separate purchase endpoint.

Benefits (free pickup, 10% off, priority slots) must be applied **server-side in
cart totals**. Nothing in the UI should decide a discount.

---

## 9. Decisions

Reviewed 2026-07-25.

### Settled

1. **Cart ownership → guest cart client-side, merged on login.** Cart stays in
   `localStorage` and works signed-out (already implemented). On login, merge
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

5. **Token strategy → Supabase Auth.** Client uses Supabase Auth directly
   (email/password + OAuth); our API only verifies the access JWT and reads
   `auth.uid()`. Revocation via refresh-token invalidation on sign-out;
   short-lived access token; httpOnly-cookie storage available via
   `@supabase/ssr`. Section 2 is rewritten around this - our own `/auth/*` routes
   are gone. Because OAuth ships with it, **Google sign-in is no longer
   deferred** (it becomes `signInWithOAuth`).
6. **Pricing model → per item.** Every catalog item has a fixed price and a
   `unit`, so the total is known at checkout and the estimate/reweigh/"final
   price pending"/pay-later flow is deleted. `unit` enum is `piece | bag | kg`;
   **launch ships `piece` only**, with `bag` and `kg` reserved for later with no
   schema change. Follow-up: the footer copy "you only pay once your laundry has
   been weighed" must change.

### Deferred (revisit later)

7. **Reviews.** `rating`/`reviewCount` stay read-only for now; write endpoints
   designed later.

- **Order chat** with the partner (placeholder today).
- **Map view** of partners (placeholder today).

---

## 10. What this changes in the UI

Not a small amount, and worth sizing before committing:

- Every list/detail screen gains loading, empty and error states
- `CartContext` loses its tax maths and becomes a thin cache over the API
- `useCheckoutForm` submits and handles `409 SLOT_UNAVAILABLE`
- Sign-in gains a credentials-error state (does not exist today)
- Timeline rendering moves from server labels to client-derived labels
- `data/*.ts` seed files are deleted; `services/*Services.ts` take their place
