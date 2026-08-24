# laundrylo - product requirements

Status: **living document**. Reflects decisions taken up to 2026-08-03.

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

| Audience               | Needs                                                       | Status               |
| ---------------------- | ----------------------------------------------------------- | -------------------- |
| **Customer**           | Find a nearby laundry, know the price up front, book, track | Building now         |
| **Partner (laundry)**  | Receive orders, set prices, mark open/closed, manage hours  | Admin panel, later   |
| **Fleet / operations** | Pickup and delivery runs                                    | Out of scope for now |

Only the customer surface is in the current build.

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
- **The cart works signed out.** It lives in `localStorage` and merges into the
  account on login (see [api-contract.md](./api-contract.md) decision 1). Sign-in
  is required only to place an order and to view bookings.
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

Consequence: the footer promise "you only pay once your laundry has been weighed"
is now false and must be reworded.

## 6. Scope

### In scope now

- Pincode search and partner listing with filters and sorting
- Partner detail with a per-partner catalog
- Cart (guest + signed-in), checkout with address and slot selection
- Order placement, order history, order tracking timeline
- Auth: email/password and Google, via Supabase Auth
- Profile and saved addresses
- laundrylo Plus membership, purchased through the cart

### Deferred

| Item                        | Why deferred                                        |
| --------------------------- | --------------------------------------------------- |
| Reviews (writing them)      | Ratings are shown read-only; write path comes later |
| Order chat with the partner | Placeholder in the UI today                         |
| Map view of partners        | Placeholder in the UI today                         |
| Partner admin panel         | Needed before real partners can self-serve          |
| Payments                    | Cash on pickup only at launch                       |

## 7. Product rules

- **Prices are final at checkout.** No estimates, no post-hoc revision.
- **Slots come from the server.** Availability depends on partner capacity and
  hours, so the client cannot invent slot lists. A full slot must be
  unselectable, and a slot that fills between selection and submit must fail
  loudly (`409 SLOT_UNAVAILABLE`).
- **Delivery cannot precede pickup.** Enforced in the client today by disabling
  invalid dates and slots, and by clearing a delivery selection that a changed
  pickup would invalidate.
- **A closed partner cannot take orders.** `isOpen` is server-owned so partners
  can toggle it from the admin panel, or automate it from opening hours.
- **Money is never computed on the client.** Tax, delivery and membership
  discounts are server-calculated and returned.
- **Order ids are not guessable.** Customers see a friendly reference
  (`LL-2026-001`); the system uses an opaque id.

## 8. Non-functional expectations

- Route-level code splitting; the homepage ships in the initial bundle
- Works signed out for everything up to placing an order
- Light and dark themes, both first-class
- Accessible forms: labelled inputs, `aria-invalid`, errors tied to fields
- Validation explains itself - the confirm button stays enabled and scrolls to
  the first problem rather than silently disabling

## 9. Open product questions

- What is the cancellation window, and who absorbs the cost after pickup?
- Do partners set their own prices, or does the platform set a rate card?
- What are the actual Plus benefits, and how do they apply to per-item pricing?
- Delivery fee: flat, distance-based, or free above a threshold?
- Which city and pincodes launch first? (demo data is Bengaluru)
