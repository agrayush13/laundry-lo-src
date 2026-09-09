# laundrylo - product requirements

Status: **living document**. Reviewed against the application on 2026-09-09.

---

## 1. Problem

Local laundries are fragmented and offline. Customers phone a shop, guess the
price, and have no way to track the order. Shops have no storefront, no
scheduling, and no record of demand.

## 2. What we are building

A marketplace that puts local laundries online, with the platform handling
discovery, booking, pickup and delivery. Zomato-shaped: customers browse
partners, order from one partner at a time, and track the order to their door.

## 3. Who it is for

| Audience               | Needs                                                         | Status                                         |
| ---------------------- | ------------------------------------------------------------- | ---------------------------------------------- |
| **Customer**           | Find a nearby laundry, know the price up front, book, track   | Product surface built                          |
| **Partner (laundry)**  | Receive orders, maintain listing and availability, set prices | Order, summary, configuration and catalogue tools built |
| **Fleet / operations** | Pickup and delivery runs                                      | Out of scope for now                           |

The customer surface and the first laundry-owner operations slices are in the
current build, including customer rescheduling, a daily owner summary,
exceptional holiday closures, per-date capacity and catalogue creation. Partner
onboarding and staff operations remain deferred.

## 4. Core flow

```
enter pincode -> browse partners -> open a partner -> add items to cart
    -> place order -> pickup address -> pickup & delivery slots
    -> confirm -> track order to delivery
```

Deliberate properties of this flow:

- **The cart is the single funnel.** An earlier four-step booking wizard was
  removed. Address and scheduling are collected _after_ Place Order, so the
  customer commits to items before being asked for details.
- **The cart works signed out.** The guest cart lives in `localStorage` and the
  authenticated cart contract merges it on login (see
  [api-contract.md](./api-contract.md) decision 1). Sign-in is required only to
  place an order and to view bookings.
- **One partner per cart.** Adding from a second partner prompts to replace.

## 5. Pricing model

**Per item.** Every catalog entry has a fixed price and a countable unit, so the
total is known at checkout.

This was an explicit decision against per-kg pricing. Per-kg cannot produce a
final price until someone weighs the bag after pickup, which forces an
estimate/revision flow, a "final price pending" state, and payment deferred until
after collection. Per-item removes all of it.

"Bag" pricing was also rejected for launch: _small/large bag_ is a vague size
word the customer cannot self-assess, so it reintroduces the same guesswork. A
bag tier is only honest when it is a real fixed-capacity physical object, which
requires logistics we do not have yet.

The `unit` enum keeps `piece | bag | kg`. **Launch ships `piece` only**; the other
two return with no schema change once operations can support them honestly.

Consequence: the footer promise "you only pay once your laundry has been
weighed" was false and has been reworded. The homepage hero carried the same
claim in its micro-line; it now reads "price shown up front", which is what
per-item pricing actually gives the customer (see
[journey.md](./journey.md) section 6.1).

## 6. Scope

### Product scope

- The marketing homepage and the URL-only wash-cycle showcase at `/journey`
  (see [journey.md](./journey.md))
- Pincode search and partner listing with filters and sorting, filterable by
  service so the homepage cards can link into a filtered listing
- Partner detail with a per-partner catalog
- Cart (guest + signed-in), checkout with address and slot selection
- Order placement, order history, order tracking timeline and eligible
  self-service cancellation or rescheduling before pickup
- Auth: email/password and Google, via Supabase Auth
- Profile and saved addresses
- laundrylo Plus membership, purchased through the cart
- Protected laundry-owner order queue, daily operational summary, fulfilment
  detail and ordered status progression
- Protected laundry settings for the public profile, multiple service pincodes,
  open/closed state, turnaround, weekly hours, holiday closures and date-specific
  per-slot capacity
- Protected catalogue creation and maintenance for services, item copy,
  per-piece prices and customer availability
- Anonymous, cookieless acquisition and product-funnel analytics with a
  server-confirmed order conversion

### Deferred

| Item                                        | Why deferred                                                                                                                                                          |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reviews (writing them)                      | Ratings are shown read-only; write path comes later                                                                                                                   |
| Order chat with the partner                 | Placeholder in the UI today                                                                                                                                           |
| Map view of partners                        | Placeholder in the UI today                                                                                                                                           |
| Partner onboarding and remaining operations | Profile, multi-pincode coverage, weekly hours, closures, date capacity and catalogue creation are available; business signup/review, assignments and staff come later |
| Payments                                    | Cash on pickup only at launch                                                                                                                                         |

### Implementation snapshot

- **Deployed full-stack foundation:** React SPA, Hono API, Supabase Auth and
  PostgreSQL with migrations and Row Level Security.
- **Production auth flows:** email registration and confirmation, password
  sign-in and recovery, Google OAuth, session restoration, token refresh and
  sign-out.
- **API source of truth:** partner search/details, per-partner catalogues, slot
  availability, profiles, addresses, server carts and totals, order
  placement/history/rescheduling, laundry-owner fulfilment queues, operational
  summaries, status progression and
  core laundry configuration, multi-pincode service areas, holiday closures,
  date-specific capacity, catalogue creation/maintenance and membership status.
- **Analytics boundary:** Umami receives sanitized route templates and
  non-identifying funnel events; PostgreSQL remains authoritative for customers,
  orders and revenue.

## 7. Product rules

- **Prices are final at checkout.** No estimates, no post-hoc revision.
- **Slots come from the server.** Availability depends on partner capacity and
  hours, so the client cannot invent slot lists. A full slot must be
  unselectable, and a slot that fills between selection and submit must fail
  loudly (`409 SLOT_UNAVAILABLE`).
- **Capacity cannot erase demand.** An owner can change the order limit for a
  local date, but cannot reduce it below orders already booked in any window.
- **Delivery cannot precede pickup.** The client disables invalid choices and
  clears a delivery selection that a changed pickup invalidates; the order
  transaction verifies the slot ordering again.
- **A closed partner cannot take orders.** `isOpen` is server-owned so partner
  operations can toggle it manually, automate it from opening hours, or close
  an exceptional local date without rewriting the weekly schedule.
- **Checkout money is server-owned.** A signed-out guest cart can display a
  local preview from catalogue prices, but tax, delivery, discounts and the
  final total are recalculated and returned by the server before placement.
- **Order ids are not guessable.** Customers see a friendly reference
  (`LL-2026-001`); the system uses an opaque id.
- **Cancellation is server-owned.** A customer can cancel their own
  service-only cash-on-pickup order while it is still at `placed` or `confirmed`
  and before scheduled pickup. Tracking and both slot reservations change in
  one transaction. Plus-activation orders and post-pickup exceptions go through
  support until their reversal/refund policies exist.
- **Rescheduling is server-owned.** Before scheduled or recorded pickup, a
  customer can move both appointments only to available slots for the same
  laundry. The order, old/new capacity and immutable before/after audit record
  change in one transaction. This remains available to Plus-activation orders
  because it does not reverse payment or membership state.

## 8. Non-functional expectations

- Route-level code splitting; the homepage ships in the initial bundle
- Works signed out for everything up to placing an order
- Light and dark themes, both first-class, on every product route; `/journey` is
  light only by design (see [journey.md](./journey.md) decision 4)
- Accessible forms: labelled inputs, `aria-invalid`, errors tied to fields
- Validation explains itself - the confirm button stays enabled and scrolls to
  the first problem rather than silently disabling
- Analytics sends no entered pincode, identity, contact/address data or record
  identifier, respects Do Not Track and never blocks a product action

## 9. Open product questions

- What partner-cancellation, failed-pickup and post-pickup exception policy
  should operations use?
- Should Plus renew automatically, and what cancellation policy should apply?
- Delivery fee: flat, distance-based, or free above a threshold?
- Which city and pincodes launch first? (demo data is Bengaluru)

## 10. The homepage and journey

The homepage at `/` is the product front door. The unlinked `/journey` route is
the motion showcase documented in [journey.md](./journey.md). They share product
facts but keep separate navigation and presentation.

- **The product must be legible in second one.** Both surfaces put the pin-code
  input in the first viewport; on `/journey` the cycle is the container, never a
  gate.
- **Claims trace to a real surface.** The homepage labels the product as a demo
  and uses implemented capability statements rather than invented customer,
  partner, timing or cancellation promises. The unlinked journey retains its
  illustrative figures as part of the preserved motion concept.
- **Service vocabulary is shared.** Marketing cards and the journey use the same
  canonical service slugs; the API derives each partner's real starting price
  from its catalogue.
- **Plus presents only implemented benefits.** It describes the server-enforced
  10% service discount, one-month access period and itemized checkout pricing.
  Pickup-fee or priority-capacity benefits stay out of public copy until the
  placement transaction enforces them.
