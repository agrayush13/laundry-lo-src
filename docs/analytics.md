# laundrylo - analytics

Status: **implemented in the application; production activation required**.
Reviewed on 2026-09-09.

## 1. Choice and boundary

laundrylo uses [Umami](https://github.com/umami-software/umami), an MIT-licensed,
open-source analytics service that can run against its own PostgreSQL database.
Its tracker is cookieless, does not identify people across websites and excludes
recognized bots by default. It provides sessions, referrers, campaign tags,
country/region, device, browser, operating system, funnels, journeys, retention
and Core Web Vitals.

Umami answers how anonymous browser sessions discover and use the product.
Application PostgreSQL remains the source of truth for customers, carts, orders
and revenue. Analytics must never become a business transaction dependency.

## 2. What is collected

Page views are sent manually so the application can normalize dynamic routes:

- `/laundries/{partnerId}` becomes `/laundries/:partnerId`.
- `/bookings/{orderId}` becomes `/bookings/:orderId`.
- `/partner/orders/{orderId}` becomes `/partner/orders/:orderId`.
- edited address URLs become `/profile/addresses/:addressId/edit`.
- search parameters are discarded except conventional, restricted `utm_*`
  campaign values.

The app never sends entered pincodes, account ids, order ids/references, partner
ids, names, email addresses, phone numbers or delivery addresses. It never calls
Umami `identify`, so an analytics session is not linked to a Supabase identity.
The tracker respects the browser's Do Not Track preference.

| Event                     | Question it answers                                     | Safe properties                                               |
| ------------------------- | ------------------------------------------------------- | ------------------------------------------------------------- |
| `partner_search`          | Which entry surface prompts a valid search?             | homepage or journey                                           |
| `partner_results`         | Do searches return useful choice?                       | result count, more-results flag, filter presence and sort     |
| `laundry_viewed`          | Do visitors open a laundry and find a usable catalogue? | open state and category count                                 |
| `cart_item_added`         | Do catalogue views become cart intent?                  | unit and whether another laundry was replaced                 |
| `cart_viewed`             | Do visitors continue into the cart?                     | aggregate item count                                          |
| `checkout_started`        | Do carts reach checkout?                                | aggregate item count and Plus selection                       |
| `password_sign_in`        | Does password authentication complete?                  | none                                                          |
| `password_sign_up`        | Does password registration complete?                    | whether email confirmation is required                        |
| `google_sign_in_started`  | Is Google selected?                                     | none                                                          |
| `auth_callback_completed` | Does an OAuth or email callback restore a session?      | none                                                          |
| `order_placed`            | Does the browser receive a completed order?             | database/fixture source, aggregate item count and Plus choice |
| `order_placed_server`     | How many new database orders actually commit?           | INR revenue, aggregate item count and Plus choice             |
| `order_tracking_viewed`   | Do customers return to tracking?                        | status and cancellation eligibility                           |
| `order_cancelled`         | Do eligible customers use self-service cancellation?    | none                                                          |

`order_placed_server` is emitted only for the first successful idempotent order
transaction. Its delivery is best-effort and cannot delay, fail or roll back an
order. Compare this event with the `orders` table when auditing analytics loss
from ad blockers, outages or Do Not Track.

## 3. Production setup

1. Deploy a separate Umami instance and PostgreSQL database. The official
   Docker image or Docker Compose setup is the shortest self-hosted path. Keep
   the analytics schema separate from the laundrylo application schema and
   change the default Umami administrator password immediately.
2. Add `laundrylo.com` as a website in Umami and copy its website id.
3. Set these browser build variables:

   ```text
   UMAMI_HOST_URL=https://analytics.laundrylo.com
   UMAMI_WEBSITE_ID=<website-id>
   UMAMI_DOMAINS=laundrylo.com,www.laundrylo.com
   ```

4. Set `UMAMI_HOST_URL` and `UMAMI_WEBSITE_ID` to the same values on the API,
   plus `PUBLIC_APP_HOSTNAME=laundrylo.com`.
5. Rebuild and deploy both projects. With Do Not Track disabled for the test
   browser, verify one page view, one search-to-checkout flow and one
   `order_placed_server` event. Confirm that no raw pincode or record id appears
   in Umami's URL or event-property views.
6. Keep `DISABLE_BOT_CHECK` unset on the Umami service. Set
   `SALT_ROTATION=month`, restrict dashboard access, back up the analytics
   database and implement a maximum 13-month detailed-data retention job. Umami
   self-hosted data otherwise remains until it is manually deleted.

Umami Cloud's Hobby tier is a no-cost managed alternative, but self-hosting is
the default here because it keeps the software and data under project control.
Neither the website id nor Umami host URL is a secret. Umami administrator
credentials, database credentials and API keys are secrets and do not belong in
frontend variables or this repository.

## 4. Dashboard to create

Use these views during the first month:

1. **Acquisition:** visitors, sessions and engaged time by referrer, landing
   page, UTM source/medium/campaign, country/region and device.
2. **Marketplace funnel:** `partner_search` -> `partner_results` ->
   `laundry_viewed` -> `cart_item_added` -> `checkout_started` ->
   `order_placed`.
3. **Trusted conversion:** trend `order_placed_server` and reconcile it with the
   database order count. Browser events explain the path; the database proves
   the transaction.
4. **Retention:** anonymous returning-session cohorts and the share that revisit
   order tracking.
5. **Quality:** empty result rate, open versus closed laundry views, checkout
   drop-off, authentication method and Core Web Vitals by device.

This describes user segments by context and behaviour, not demographics. It can
show mobile versus desktop, location, source, new/returning patterns and flow
completion. It cannot truthfully infer age, gender, occupation or a person's
identity, and the application should not attempt to collect those merely for a
dashboard.

## 5. Humans and bots

Use two independent measurements:

- **Umami** counts browsers that execute the tracker, respects Do Not Track and
  excludes recognized bots by default. This is the closer estimate of
  human-like product usage, especially when sessions also produce meaningful
  events such as search, catalogue view and cart activity.
- **Cloudflare HTTP Traffic and Security analytics** see edge requests,
  including crawlers and threats. On Cloudflare's Free plan, HTTP Traffic totals
  combine legitimate requests, crawlers and threats; more detailed automated,
  likely automated, likely human and verified-bot groupings require a paid bot
  analytics tier. Cloudflare Web Analytics is a separate browser-side real-user
  view and should not be confused with edge request totals.

Compare Cloudflare HTML page views with Umami page views and sessions, then
inspect whether Umami sessions progress beyond one page. A large edge-only
surplus or many repetitive requests to the same paths suggests crawlers or
scanners. A high Umami count with no product events suggests low-intent visitors,
link previews that execute JavaScript or automation sophisticated enough to look
like a browser.

There is no exact free human/bot percentage. Ad blockers, Do Not Track, disabled
JavaScript, failed script loads and consent choices all create real-human visits
that Umami will not see; sophisticated automation can execute JavaScript. Treat
the comparison as a confidence range, not a forensic identity verdict.
