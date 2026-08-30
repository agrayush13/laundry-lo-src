# laundrylo - data schema

Status: **implemented**. Postgres on Supabase, built by
`supabase/migrations/` and filled by `supabase/seed.sql`. Pairs with
[api-contract.md](./api-contract.md); this is the storage shape behind it.

---

## 1. Conventions

- **Primary keys** are opaque text ids with a type prefix (`ord_01J8XR3K2W`),
  generated as time-ordered ULIDs with cryptographic entropy. Never sequential
  integers, never guessable from a URL.
- **Money** is stored as `integer` minor units (paise) alongside a `currency`
  text column. No floats anywhere in the schema.
- **Timestamps** are `timestamptz`, always UTC. `created_at` / `updated_at` on
  every table.
- **Enums** are Postgres enum types, lowercase snake case.
- **Identity** lives in Supabase's `auth.users`. Our tables reference it by
  `auth.uid()`; we never store passwords.
- **Row Level Security is on for every table.** Customers can only read and
  write their own rows; partner-owned rows are readable publicly but writable
  only by that partner.

## 2. Enums

```sql
create type unit_type       as enum ('piece', 'bag', 'kg');
create type order_status    as enum ('processing', 'out_for_delivery', 'delivered', 'cancelled');
create type order_event     as enum ('placed', 'confirmed', 'picked_up', 'in_progress',
                                     'out_for_delivery', 'delivered', 'cancelled');
create type slot_state      as enum ('open', 'full', 'blocked');
create type membership_plan as enum ('plus');
```

`unit_type` carries all three values from day one even though **launch only uses
`piece`** - so bag and kg pricing arrive later without a migration.

## 3. Tables

### profiles

App-level user data. Supabase owns the credentials; this owns everything else.

| Column         | Type        | Notes                     |
| -------------- | ----------- | ------------------------- |
| `id`           | uuid PK     | equals `auth.users.id`    |
| `full_name`    | text        |                           |
| `phone`        | text        |                           |
| `sms_opt_in`   | boolean     | default true              |
| `email_opt_in` | boolean     | default false             |
| `created_at`   | timestamptz | doubles as "member since" |

Created on first login by a trigger on `auth.users`.

### addresses

| Column           | Type    | Notes                            |
| ---------------- | ------- | -------------------------------- |
| `id`             | text PK | `adr_...`                        |
| `user_id`        | uuid FK | -> profiles, cascade delete      |
| `label`          | text    | Home, Office                     |
| `recipient_name` | text    | who receives it, not the account |
| `phone`          | text    |                                  |
| `building`       | text    |                                  |
| `street`         | text    |                                  |
| `landmark`       | text    | nullable                         |
| `pincode`        | text    | indexed                          |
| `is_default`     | boolean | partial unique index per user    |

### partners

| Column             | Type    | Notes                                    |
| ------------------ | ------- | ---------------------------------------- |
| `id`               | text PK |                                          |
| `owner_id`         | uuid FK | -> profiles; who administers it          |
| `name`             | text    |                                          |
| `about`            | text    |                                          |
| `line1` `line2`    | text    | structured address                       |
| `city` `pincode`   | text    | pincode indexed for search               |
| `latitude`         | numeric | for distance and the future map view     |
| `longitude`        | numeric |                                          |
| `turnaround_hours` | integer |                                          |
| `is_open`          | boolean | manual override from the admin panel     |
| `auto_schedule`    | boolean | when true, opening hours drive `is_open` |
| `image_url`        | text    |                                          |
| `image_alt`        | text    |                                          |

`rating` and `review_count` are **not columns** - they are derived from
`reviews` (below) via a view or materialized aggregate, so they cannot drift.

Until reviews ship, they can be denormalized columns seeded from demo data.

### partner_hours

One row per weekday per partner. Drives `auto_schedule`.

| Column       | Type     | Notes                |
| ------------ | -------- | -------------------- |
| `partner_id` | text FK  |                      |
| `weekday`    | smallint | 0-6                  |
| `opens_at`   | time     | nullable when closed |
| `closes_at`  | time     | nullable when closed |

### partner_tags

Many-to-many; tags are slugs (`free-pickup`), never display strings.

| Column       | Type    |
| ------------ | ------- |
| `partner_id` | text FK |
| `tag`        | text    |

### catalog_categories

| Column       | Type    | Notes                         |
| ------------ | ------- | ----------------------------- |
| `id`         | text PK |                               |
| `partner_id` | text FK | catalogs are **per partner**  |
| `service`    | text    | constrained canonical slug    |
| `name`       | text    | "Wash & Fold", "Dry Cleaning" |
| `position`   | integer | display order                 |

`service` is the platform's vocabulary, `name` is the partner's. They are
separate so a partner can call a category "Express Dry Clean" without falling out
of a `services=dry-cleaning` filter, and so the homepage service cards keep working
when partners rename things. `Partner.services` in the API is the distinct set of
`service` values across a partner's categories. A database check rejects values
outside `wash-fold`, `wash-iron`, `dry-cleaning` and `premium-care`.

### catalog_items

| Column        | Type      | Notes                                      |
| ------------- | --------- | ------------------------------------------ |
| `id`          | text PK   |                                            |
| `category_id` | text FK   | -> catalog_categories                      |
| `name`        | text      | "Shirt / T-shirt"                          |
| `description` | text      | nullable                                   |
| `price`       | integer   | minor units                                |
| `currency`    | text      | default 'INR'                              |
| `unit`        | unit_type | `piece` at launch                          |
| `icon_key`    | text      | maps to the client icon registry, no emoji |
| `is_active`   | boolean   | hide without deleting history              |
| `position`    | integer   |                                            |

The service is encoded in the item: _Wash & Fold - Shirt_ and _Dry Clean - Shirt_
are separate rows under separate categories.

### slots

Server-owned availability. The client must never invent these.

| Column       | Type        | Notes                  |
| ------------ | ----------- | ---------------------- |
| `id`         | text PK     | `slt_...`              |
| `partner_id` | text FK     |                        |
| `starts_at`  | timestamptz |                        |
| `ends_at`    | timestamptz |                        |
| `capacity`   | integer     |                        |
| `booked`     | integer     | default 0              |
| `state`      | slot_state  | `blocked` for holidays |

Availability is `state = 'open' and booked < capacity`. Booking increments
`booked` inside the order transaction, which is what makes
`409 SLOT_UNAVAILABLE` truthful under concurrency.

### carts / cart_items

Server cart for signed-in users. Guests hold the same shape in `localStorage`
and merge on login.

**carts**

| Column       | Type    | Notes                             |
| ------------ | ------- | --------------------------------- |
| `id`         | text PK | `crt_...`                         |
| `user_id`    | uuid FK | unique - one active cart per user |
| `partner_id` | text FK | nullable; one partner per cart    |
| `has_plus`   | boolean | membership added to this cart     |

**cart_items**

| Column     | Type    | Notes                                   |
| ---------- | ------- | --------------------------------------- |
| `cart_id`  | text FK |                                         |
| `item_id`  | text FK | -> catalog_items; unique with `cart_id` |
| `quantity` | integer | check > 0                               |

Prices are **not** stored on the cart - they are read live from `catalog_items`
so a price change is reflected before checkout. Totals are computed server-side.

### orders

| Column             | Type         | Notes                                       |
| ------------------ | ------------ | ------------------------------------------- |
| `id`               | text PK      | `ord_...`, opaque, used in URLs             |
| `reference`        | text unique  | `LL-2026-001`, display only                 |
| `user_id`          | uuid FK      |                                             |
| `partner_id`       | text FK      |                                             |
| `status`           | order_status |                                             |
| `subtotal`         | integer      | minor units                                 |
| `delivery_fee`     | integer      |                                             |
| `tax`              | integer      |                                             |
| `total`            | integer      |                                             |
| `currency`         | text         |                                             |
| `pickup_slot_id`   | text FK      |                                             |
| `delivery_slot_id` | text FK      | check: strictly after pickup                |
| `idempotency_key`  | text unique  | per user; replays return the original order |
| `placed_at`        | timestamptz  |                                             |

`reference` is generated for display only; nothing looks up by it.

### order_items

A **snapshot**, not a reference. Prices and names are copied at placement so a
later catalog edit never rewrites history.

| Column       | Type      | Notes          |
| ------------ | --------- | -------------- |
| `order_id`   | text FK   |                |
| `item_id`    | text      | soft reference |
| `name`       | text      | copied         |
| `unit`       | unit_type | copied         |
| `unit_price` | integer   | copied         |
| `quantity`   | integer   |                |
| `line_total` | integer   |                |

### order_addresses

The pickup/delivery address is likewise **copied** onto the order, so editing or
deleting a saved address does not mutate past orders.

| Column                                                                    | Type    |
| ------------------------------------------------------------------------- | ------- |
| `order_id`                                                                | text PK |
| `label` `recipient_name` `phone` `building` `street` `landmark` `pincode` | text    |

### order_events

The tracking timeline. Rows are **facts that happened** - no labels, no
formatted times, no `done/current/pending`. The client derives all presentation
from the event sequence.

| Column        | Type        |
| ------------- | ----------- |
| `id`          | bigint PK   |
| `order_id`    | text FK     |
| `type`        | order_event |
| `occurred_at` | timestamptz |
| `note`        | text        |

`orders.status` is a denormalized convenience derived from the latest event.

### memberships

| Column       | Type            | Notes |
| ------------ | --------------- | ----- |
| `user_id`    | uuid PK FK      |       |
| `plan`       | membership_plan |       |
| `started_at` | timestamptz     |       |
| `renews_at`  | timestamptz     |       |
| `is_active`  | boolean         |       |

Benefits are applied **server-side in cart totals**. Nothing in the UI decides a
discount.

### reviews (deferred)

Designed now so `partners.rating` has a real source later.

| Column       | Type     | Notes                         |
| ------------ | -------- | ----------------------------- |
| `id`         | text PK  |                               |
| `order_id`   | text FK  | unique - one review per order |
| `user_id`    | uuid FK  |                               |
| `partner_id` | text FK  |                               |
| `rating`     | smallint | check between 1 and 5         |
| `comment`    | text     |                               |

Tying a review to an order means only real customers can review.

## 4. Relationships

```
auth.users 1--1 profiles 1--* addresses
                         1--1 carts 1--* cart_items *--1 catalog_items
                         1--* orders 1--* order_items
                                     1--1 order_addresses
                                     1--* order_events
                                     1--? reviews
                         1--? memberships

partners 1--* partner_hours
         1--* partner_tags
         1--* catalog_categories 1--* catalog_items
         1--* slots
         1--* orders
```

## 5. Indexes worth having early

- `partners (pincode)` and `partners (pincode, is_open)` - the listing query
- `catalog_categories (service, partner_id)` - filtering the listing by service
- `slots (partner_id, starts_at)` - the slot picker
- `orders (user_id, placed_at desc)` - order history pagination
- `order_events (order_id, occurred_at)` - timeline
- `addresses (user_id)`
- unique `orders (user_id, idempotency_key)` - double-tap protection

## 6. Questions answered by the first migration

Status of this document is now **implemented** for everything above:
`supabase/migrations/` builds it and `supabase/seed.sql` fills it with the
Bengaluru demo set.

- **Catalogue prices are per partner.** `catalog_items` hangs off a partner's
  own categories, with no shared rate card and no override table. The seed
  scales one base rate card by a per-partner factor, which is a seeding
  convenience rather than a schema the platform enforces.
- **Slots are generated ahead**, one row per slot per day, by
  `generate_slots(partner_id, from_date, days)` reading `partner_hours`. Derived
  windows avoid a growing table but leave `booked` and holiday blocking with
  nowhere to live, and it is `booked` that makes `409 SLOT_UNAVAILABLE` truthful
  under concurrency. The table is small - one partner-fortnight is roughly 80
  rows - and old rows can be pruned once orders reference a snapshot.
- **Distance is haversine from a pincode centroid**, not PostGIS.
  `pincode_centroids` maps a searched pincode to a point, `haversine_meters`
  measures from it, and `GET /partners` accepts explicit `latitude`/`longitude`
  to override. PostGIS earns its place when there is a map view and radius
  search; a scalar function costs no extension today.
- **`owner_id` alone**, no `partner_staff`. One administrator per partner is
  enough for the first admin panel, and the RLS policies all funnel through
  `owns_partner(partner_id)`, so adding staff later changes that one function
  rather than every policy.
- **`rating` and `review_count` are denormalised columns** for now, seeded from
  the demo data, exactly as this document allowed. They become an aggregate over
  `reviews` when reviews ship, and the API already reads them through the
  `partner_details` view, so that swap does not touch a route.

Still open:

- Who generates slots in production, and how far ahead? The seed calls
  `generate_slots` directly through the privileged `service_role`; a scheduled
  job needs to roll the window forward and decide how far out a customer may book.
- Pruning. `slots` and `order_events` both grow without bound.
