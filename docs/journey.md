# laundrylo journey - the cycle

Status: **living document**. Design decisions settled 2026-07-21, build decisions
settled 2026-08-24, split out of the homepage 2026-08-25. This is the
authoritative reference for the journey: it supersedes the v1 design doc, the six
section briefs and the three iteration docs, whose surviving content is merged
here.

The journey lives at `/journey`. It was built as a replacement homepage and is
not one: the marketing homepage at `/` stays exactly as it was, and this is the
same story told a second way, as a thing that happens rather than a page that
describes it. Both read from the same configuration, so a figure quoted here
cannot differ from the one quoted there. Section 20 records what that costs and
which files enforce it.

Where this document says "the homepage", read "the journey": the wording predates
the split and the mechanics are unchanged.

Pairs with [prd.md](./prd.md) for product rules and
[architecture.md](./architecture.md) for how the page is put together.

**Finalized assets, reference and never recreate:** `laundrylo-logo.svg`
(lockup, final "o" is the drum), `laundrylo-mark.svg` (drum mark),
`laundrylo-appicon-v2.svg`, `laundrylo-washer.svg` (machine). All four live in
`ui/src/assets/`. The built machine and header wordmark must match these.

**v2.2 changes:** pricing follows the per-item model (section 7.3), build
decisions recorded (section 19), open items closed (section 17), micro-line
reworded, S3 keeps the drum at its centre.

**v2.3 changes:** every phase pins and scrubs (decision 16), no scroll snapping
(17), per-frame transforms bypass GSAP (18), wind is gathered per frame (19), the
cycle moved to `/journey` and the marketing homepage came back (section 20).

**v2.4 changes:** the pointer wind is cut and the line breathes on its own while
it is held (decision 20), the spin starts on sight rather than on the hold (21),
the iron makes three tracked crossings and a crease goes out under the plate that
passes over it (22), and the header plays the whole cycle instead of linking into
the middle of it (23).

**v2.5 changes:** the whole page is paced down and a hard scroll is capped at a
speed a phase can be read at (decision 24); the detergent pour and the iron are
slowed further than that on their own account, and the detergent now dissolves
instead of staying in the drum (section 6.3.6). The scroll no longer touches the
S3 figures at all (section 8.2).

---

## 1. Product context

laundrylo is a laundry marketplace for Bengaluru, Zomato-shaped: compare local
laundries, read reviews, book a pickup. The platform owns delivery, partner
laundries clean. The app (listings, booking flow, My Bookings) lives behind
"Find laundries"; the marketing homepage at `/` is the front door, and this
journey is the URL-only design showcase beside it.

## 2. Governing concept: the cycle

The entire site is one wash cycle. Scroll position is cycle progress:
**wash, rinse, spin, dry, press and fold, deliver.** Every section is a phase,
every mechanic derives from the metaphor, and each section occupies exactly one
viewport (S1 and S4 pin for longer than one viewport of _scroll_, but never
render taller than one screen).

Narrative arc: the opening states the problem (laundry eats your weekends); the
site performs the solution by washing the complaint away. Problem text goes into
the machine, a clean message comes out, and the garments that entered as stained
headline glyphs are followed through the whole cycle until they are delivered
folded in the footer.

## 3. Brand system

**Palette:** warm paper `#FAF6EF`, ink `#1F1D1A`, water and powder blue
`#8FBFEA` (water and illustration only), soap pink, mint, muted amber.
**Interactive accent:** deep steel blue for buttons, links, focus rings and
label numbers; never illustration. **Amber** is dual purpose: stains (dirty
state) and the Plus membership tint (S5 and the booking summary discount line),
nowhere else.

Banned: gradients, glassmorphism, dark sections, photography,
terracotta-on-cream and dark-with-acid-accent defaults.

**Type:** Fraunces variable (opsz, wght, SOFT and WONK, all four axes used, see
section 6.4) for display; a clean grotesque for body, UI and labels.

**Backgrounds:** one warm-paper world across all sections. Sanctioned experiment
at build: up to a 3 to 4% tint drift toward each section's signature pastel (S2
blue, S4 warmth). Build uniform first, A/B the whisper. Never more, never dark.

**Dirty and clean rule:** dirty states are illustrated and stained, clean states
are crisp type and geometry. The wash transforms one into the other.

**Recurring motifs:** drum and porthole, water lines, droplets, bubbles, pegs and
rope, folded stacks. Water-in-a-circle echoes across logo, machine door,
progress dial and loader.

## 4. Global rules

1. **Product legible in second one.** The pin-code input is reachable within the
   first viewport. The cycle is the container, never a gate.
2. **Static first performance.** Rest states paint instantly, text is the LCP,
   illustration is inline SVG, heavy interaction initializes after first paint.
3. **Motion determinism.** Deterministic choreography (letters, folds, garment
   landings, drains, water levels) is position scrubbed and fully reversible.
   Stochastic ambient effects (droplets, bubbles, sway, steam) are direction
   agnostic, respond to absolute scroll velocity, and never rewind: reversing
   particle physics reads as a glitch.
4. **Performance spec.** transform, opacity and clip-path only; no
   layout-affecting animation; **no CSS filter blur during motion**, fake it with
   skew, stretch and opacity ghosts. `will-change` is applied during pins and
   removed after. ScrollTrigger scrub smoothing 0.5 to 1s. Lenis and GSAP
   ScrollTrigger are the spine.
5. **prefers-reduced-motion:** every section renders complete final content
   statically; choreography and ambient motion are disabled, and controls whose
   only purpose is to move the page are not offered. 100% content parity.
6. **Honesty rule.** Claims trace to a real product surface. No invented
   testimonials or customer counts. The three S3 numbers are demo figures and are
   covered by the footer disclaimer, which is why that disclaimer is set plainly
   and unmissably (section 11.4).
7. **Pacing.** S1 theatrical, S2 calm, S3 burst, S4 slow exhale, S5 precise, S6
   quiet. One showpiece (S4). Boldness spent in one place per section.
8. **No section separators.** No divider rules, borders or hard colour breaks
   between sections. The page is one continuous cycle and the narrative
   transitions (section 12) are the seams. Section eyebrows carry wayfinding. The
   one sanctioned hairline rule on the page sits inside S6, between the delivery
   scene and the footer row.
9. **Content never straddles a crease or fold line** (S5's panels, any folded
   object): text and controls sit fully inside one panel. A price or CTA split
   across a crease is a defect.
10. **Every section fills exactly one viewport**, including S6. No section
    renders shorter than 100vh; short content is centred in the space, not
    stacked at the top.

## 5. Cross-section components

**5.1 Cycle-progress dial (corner persistent).** A roughly 40px drum-o, ink ring
with a water fill, fixed in a corner site wide. Water level is scroll progress:
near empty at hero rest, filling per section, full at the footer where it
completes with a small settle as S6 enters. No label. Reduced motion: static at
the current level. **S3 exception:** S3 carries its own drum at the centre of the
composition, so the corner dial fades out while S3 is in view and returns at S4.
Two water circles on screen at once read as a bug. Mobile: bottom left, 32px, 60%
opacity until touched.

**5.2 Loader.** The drum mark with water sloshing and rotating inside. Initial
load and app-route transitions only, never faked for effect. It replaces the
current `PageFallback`. Reduced motion: static mark.

**5.3 The tour (header control).** One button, in the cycle's own header, that
plays the whole thing: it cuts to the top behind a fade and then scrolls the page
at a constant 0.36 viewports a second, which is playback speed because every
phase is scrubbed against the scroll. A wheel, a swipe or a scrolling key hands
the page straight back at the position it had reached. Not offered at all under
reduced motion.

This replaced a "how it works" link that pointed at S4. The question it answered
is "how does this work", and the answer is the cycle in order, not the fourth
sixth of it.

**Superseded: the custom wind cursor (S4 only).** Inside S4's bounds the cursor
became a wind-swirl mark and moving it pushed a gust. Cut in v2.4; see decision 20.

**5.4 Pin-code input.** One component, two placements (S1 hero, S6 footer):
6-digit validation, then navigate to the API-backed listing. Any valid 6-digit
pin navigates; a pin with no matching partners resolves to the listing's empty
state rather than being guessed at by the input.

**5.5 Header.** Logo lockup (`laundrylo-logo.svg`, never typeset) plus the tour
control (section 5.3). No dark-mode toggle, no cart, no sign-in: the cycle's
header carries two items and nothing else. It is not sticky; it scrolls away with
the hero. Mobile: logo left, the control collapses to a single text button, no
hamburger.

The shared app header and footer are **not rendered on `/journey`**. Every other
route keeps the current chrome. The route is deliberately absent from product
navigation and remains available by direct URL.

---

## 6. Section 1: hero, the wash

```
DESKTOP (rest state)
+-------------------------------------------------------------+
| laundrylo.                              how it works   o    |
|                                                             |
|   BENGALURU . PICKUP & DELIVERY         +----------------+  |
|                                         |  o          .  |  |
|   Another weekend,                      |                |  |
|   los[TEE] to [SOCK]aundry.             |    ,------.    |  |
|                                         |   ( glass  )   |  |
|   Compare local laundries, read         |    `------'    |  |
|   reviews, book a pickup. Clean         |                |  |
|   clothes back in 24 hours.             |  ==========    |  |
|                                         +----------------+  |
|   [ 560103 ] [ Find laundries -> ]         ~~~ shadow ~~~   |
|   free pickup . 24h turnaround . price shown up front       |
|                                                             |
|                    SCROLL TO WASH                     (o)   |
|                          v                                  |
+-------------------------------------------------------------+
```

### 6.1 Rest state (static, instant paint)

Two columns, left roughly 55 to 60%: eyebrow "BENGALURU · PICKUP & DELIVERY";
headline; sub-line "Compare local laundries, read reviews, book a pickup. Clean
clothes back in 24 hours."; pin input (placeholder 560103) and "Find laundries";
micro-line "free pickup · 24h turnaround · price shown up front".

The third beat of that micro-line was "pay after weighing" in v2.1. Per-item
pricing retired that promise (see [prd.md](./prd.md) section 5), so it now states
what per-item pricing actually gives the customer.

Bottom centre: "SCROLL TO WASH" and a down arrow. Right: the machine per
`laundrylo-washer.svg`, ink-ring door, detergent drawer, dial, mint standby LED
(a slow blink, the only rest-state motion), feet, ground shadow, glass near
empty. The hero block is positioned so the bottom breathing room exceeds the top.

The washer SVG is **regrouped, not redrawn**, into named groups (door, drawer,
glass, LED) so the door can swing and the drawer can tint. Path data and colours
are untouched.

**Headline (locked pair):** "Another weekend, lost to laundry." washed into
"Get your weekends back." with "weekends" in steel blue.

### 6.2 Garment glyphs

Exactly two substitutions, solid ink, matching the type's stroke weight, on the
baseline, each with a small muted-amber stain:

1. **t-shirt = the "t" in "lost".** Built on a t skeleton: sleeves form the
   crossbar at true crossbar height, the body is the stem, ascender height is
   respected. Stain on the chest.
2. **sock = the "l" in "laundry".** An l is a bare vertical stem, which is
   exactly a sock hanging from its cuff. Ribbed cuff at the ascender top,
   straight leg down the stem, **foot bending right at the baseline** (an l's
   terminal tail), toe rounded. The foot sits ON the baseline, not below it.
   Stain on the heel. (The earlier y-descender version failed two design rounds
   and is abandoned.)

**Known wrinkle, accepted:** "lost" also begins with an l, which stays plain
type. Selective substitution normally tolerates this. **Sanctioned fallback** if
it ever reads as inconsistent: move both glyphs into "lost", sock-o-s-tee, so one
word carries the treatment and every other l stays plain.

Acceptance: at a squint the headline reads "lost to laundry." without
hesitation; on second look the t is a shirt and the l is a sock.

### 6.3 Scroll choreography (pinned about 2.5 viewports of scroll, scrubbed, reversible)

1. The door swings open.
2. Garment glyphs detach first (tee, then sock) and arc into the drum.
3. Remaining letters follow with a per-letter stagger as a **continuous
   bead-string trail**: adjacent letters overlap by at most 30%, each on its own
   arc (apex plus or minus 10 to 15%) with its own rotation; past roughly 90
   degrees each swaps to a coloured cloth scrap. At any scrub position the trail
   is a spaced stream from headline to door, never a pile.
4. **The remaining headline collapses** as letters depart: tracking and word
   space tighten smoothly, so the line always reads as shrinking-but-composed
   text, never text with holes.
5. The door shuts.
6. **Detergent beat (two-stage pour):** a small measuring cup tips into the
   drawer (positioned just above it); the drawer shifts pink for a beat; after a
   short travel delay the **soap-pink ribbon enters the glass from its top edge**
   and sinks. A beat later the drawer releases the **powder-blue conditioner
   ribbon** on its own. Liquid is visible ONLY inside the glass, never crossing
   the machine body. Water rises concurrently and a **white foam line**
   (irregular, hairline to 4px, 2 or 3 bubble clusters) rides the surface. The
   two ribbons marble, visibly mixing, never blending to a muddy third colour,
   and **each one disperses once it lands**: it holds its colour as it meets the
   water and then goes. A ribbon that thins and stops is detergent poured into a
   machine and never dissolved, and it sits in the drum through the spin.
   Optional caption: "eco-friendly detergents at partner laundries."
7. **The clean headline resolves early.** "Get your weekends back." enters word
   by word during the water beat, in final position, plain type, no stains, and
   is complete by spin-up. The left column has content at every scrub position;
   mid-scrub emptiness is a defect.
8. The drum spins up, foam and swirls smear into rotation for one beat, unpin.

Reversal: scrolling up dissolves the clean words in reverse, then letters fly
back out and stains return. The sub-line, input and CTA never move and stay
clickable throughout.

### 6.4 "Losing starch"

Per letter, over the first roughly 30% of flight: Fraunces wght 560 to 380 (the
stroke thins, starch leaving), SOFT 0 to 100 (terminals round), WONK on
(destabilized alternates), 3 to 5 degrees of skew, slight tracking drift.
Sequence: crisp, limp, tumbling, scrap swap. One variable font, compositor only.

This is why Fraunces is **self-hosted as the full four-axis variable file**.
Google's default CSS2 slice ships opsz and wght only, which would silently drop
SOFT and WONK.

---

## 7. Section 2: rinse, services

```
DESKTOP
+------------------------------------------------------------+
| ~~~~~~~~ drain-wave curtain sweeps down ~~~~~~~~~~~~~~~~~~ |
|   . droplet     . droplet          . droplet               |
| ---------- settles into a thin water line ---------------- |
|  02 . THE RINSE . SERVICES        (bubbles rise during     |
|                                    entry only)             |
|  Every kind of clean.                                      |
|                                                            |
|  +----------------------+   +----------------------+       |
|  | [icon]               |   | [icon]               |       |
|  | Wash & Fold          |   | Wash & Iron          |       |
|  | Everyday clothes...  |   | Washed and crisply...|       |
|  | -------------------- |   | -------------------- |       |
|  | from ₹20/piece    -> |   | from ₹30/piece    -> |       |
|  +----------------------+   +----------------------+       |
|  +----------------------+   +----------------------+       |
|  | Dry Cleaning         |   | Premium Care         |       |
|  +----------------------+   +----------------------+       |
|            [ Find laundries near you -> ]            (o)   |
+------------------------------------------------------------+
```

### 7.1 What this section is, plainly

The hero ends with a full drum of water. This section is where that water
**drains out** and the page moves on: narratively the rinse, functionally the
services menu. It is the **calmest screen on the site**, deliberately. The hero
was theatrical and S3 is a burst, so this one breathes. Almost nothing moves here
after it arrives. Its whole job: show what laundrylo does, at what price, and
push people into the app.

### 7.2 The entry: three beats, then stillness

This is the only choreography in the section, and it plays as you scroll in from
the hero:

1. **The curtain.** A band of powder-blue water, two overlapping layers with an
   irregular hand-drawn lower edge (not a smooth mathematical sine), sweeps down
   from the seam where the hero ends, as if the machine's water is draining down
   the page. It covers roughly the top third of the section at its lowest, then
   retreats upward.
2. **The droplets.** 4 to 6 small droplets fall out of the retreating curtain at
   different speeds and vanish, the drips after a pour.
3. **The bubbles.** 3 or 4 soap bubbles, **no text inside**, rise from the lower
   part of the section and pop when they reach the settling water line. Entry
   only, they never loop.

The curtain settles into a **thin horizontal water line** high in the section (a
hairline, powder blue) which stays for the rest of the section, the same
water-in-a-line motif as the logo's drum. That line is the only thing that may
move afterward, and only as an imperceptible drift. A curtain left sitting as a
thick band across the top is a section separator, which rule 4.8 bans.

**Then the cards arrive:** each rises 30 to 40px from below its final position
while a soft mask reveals it bottom up, as if lifted out of the water and
breaking the surface. Left-to-right stagger, 60 to 90ms apart. No rotation, no
bounce, no physics. Once landed, the section is still.

### 7.3 The cards

Four services, 2x2 on desktop (the earlier "one row of four" is superseded).

| card         | copy                                     | price           | tint  |
| ------------ | ---------------------------------------- | --------------- | ----- |
| Wash & Fold  | Everyday clothes, washed, dried, folded. | from ₹20/piece  | blue  |
| Wash & Iron  | Washed and crisply pressed.              | from ₹30/piece  | mint  |
| Dry Cleaning | Delicate fabrics, handled with care.     | from ₹199/piece | pink  |
| Premium Care | Suits, sarees, lehengas, luxury items.   | from ₹349/piece | amber |

Prices are read from `SERVICE_TYPES` rather than typed into the section. They are
illustrative platform starting points; the API derives each partner's actual
`startingPrice` from its active catalogue items. The v2.1 per-kg figures (₹49/kg,
₹69/kg) are gone with the per-item model.

The service ids are the same four canonical slugs enforced by PostgreSQL:
`wash-fold`, `wash-iron`, `dry-cleaning` and `premium-care`. The listing sends
the selected slug to the API, while partner-specific category names remain free
to differ. This closes the old `dry-clean`/`special` vocabulary seam without
turning marketing cards into a second catalogue.

**Anatomy, top to bottom:** outline garment icon, tight gap, service name
(Fraunces), one-line description, hairline rule, price row with a small
steel-blue arrow at the right. Surface: paper white with a very low saturation
tint wash, hairline border, gentlest elevation, generous rounded corners. No
photos, no heavy shadows.

Each card links into the listing filtered by that service:
`/laundries?pin=560103&service=wash-fold`, where the pin falls back to a default
constant when the visitor has not entered one. The listing shows the active
service as a removable chip beside the tag filters. **Hover:** the icon performs
exactly one small motion (a sleeve lifts, a hanger sways once) and the card lifts
a hair, no loops. Below the grid, centred: **"Find laundries near you"** in steel
blue.

**Icon style note:** S2 uses outline-style UI icons. This divergence from the
hero's solid ink is accepted and intentional (UI icons against narrative
illustration). S4 and S6 garments follow the hero's SOLID language, never this
outline style.

### 7.4 Why it is allowed to feel sparse

Reviewers land on this after the hero's theatre and may read the calm as
emptiness. It is the designed contrast: the entry is dramatic, the resting state
is quiet, and S3 immediately follows with the loudest screen on the site. The fix
for "too empty" is tighter card rhythm and a stronger entry, never more content.

---

## 8. Section 3: spin, stats

```
DESKTOP
+------------------------------------------------------------+
| 03 . THE SPIN                                              |
|              .    /  \   . droplet streaks .               |
|      24h                              52+                  |
|   average turnaround            partner laundries          |
|                     ( drum )                               |
|         .          (  o   )            .                   |
|                        6                                   |
|                  pin codes in blr                          |
|           .          \  /        .                         |
| ~~~~~~~~~ pooled water line grows ~~~~~~~~~~~~~~~~~        |
+------------------------------------------------------------+
```

**8.1 Content:** exactly three numbers, **24h** (average turnaround), **52+**
(partner laundries), **6** (pin codes in blr). Fraunces digits at **15 to 20vw**,
enormous, dominating, nearly touching; a steel-blue "+"; short lowercase
grotesque labels. Nothing else. These are demo figures rather than counts of the
seed data (which holds 6 partners across 3 pin codes); the footer disclaimer
carries them, and it is set to be unmissable for exactly this reason.

**8.2 Mechanic.** The digits blur-spin as slot strips (fake blur per rule 4.4)
from the moment they come into view, a quarter of a viewport before the section
is held. The reel whips, decelerates and lands on the figure, the money moment.

**Scroll is the motor of everything here except the figures.** It is direction
agnostic and reads absolute velocity: faster scrolling means a harder-driven
drum, heavier spray and a fuller pool. **The numbers roll once a visit and are
then final**, up or down, until the page is reloaded. A figure has one true
value, so anything that moves it has to end on it, and a quantity driven by
scroll speed ends wherever the scrolling stopped: parked mid-roll it leaves a
crisp, confident, wrong number on the screen. The blur belongs to the roll for
the same reason, and not to the scrolling: a landed number that softens whenever
the page moves is a number that looks about to change.

**8.3 Droplets shed from the digits.** The spinning strips fling droplets
tangentially off their own edges: the numbers ARE the laundry being wrung.
**Emission floor:** a minimum ambient drip rate whenever the section is active,
so slow scrollers always see it; velocity adds intensity.

**8.4 The pool.** Droplets arc down and accumulate into a thin water line along
the section's bottom edge, growing toward a cap. It is a line that grows, not a
slab: a full-height band across the bottom reads as a section separator.
Position linked, so it **drains as S4 enters** and refills when scrolling back up
from S4. Within S3 it only grows; emitted droplets never un-emit.

**8.5 Composition: radial around the drum.** The centrifuge needs an axis, and
the drum mark sits on it. The corner progress dial fades out for the duration of
S3 (section 5.1) so only one water circle is on screen. A flat stat row is
banned.

---

## 9. Section 4: dry, the clothesline (showpiece)

```
DESKTOP (assembled rest state)
+------------------------------------------------------------+
| 04 . THE DRY                                               |
| \                                                       /  |
|  \___|_____|_______|______|______|______|______________/   |
|      [TEE]  [SOCK]  [SHIRT] [KURTA] [HANKY] [TOWEL]        |
|      01     (plain) 02      03      (plain) 04             |
|      book           we      partners        back           |
|      a pickup       collect clean           in 24h         |
|     ~shadow~ ~shadow~ ~shadow~ ~shadow~ ~shadow~           |
|                                                            |
|           Hung out, so you don't have to.            (o)   |
+------------------------------------------------------------+
   (step text is PRINTED ON the garment; no tags, no strings)
```

**9.1 The scene.** A rope across the full width: natural catenary, moderate sag,
2.5 to 3px, jute tone with a two-strand twist hint, **anchor hooks at both
edges**. Wooden pegs. An empty paper sky: no clouds, sun, birds, grass or
horizon. Scenery is banned; atmosphere comes from motion, shadows and negative
space.

**9.2 Sunlight via shadows, not a sun.** Each garment casts a soft blurred shadow
on the paper below the line, elongated slightly to one consistent side, low
opacity, transform linked so it moves with the sway. Light is implied by effect,
never by source. Pre-blurred shapes (static blur), transform-only motion.

**9.3 Garments: 25 to 30% larger than the v2.1 design, six total, solid fill.**
Returning hero garments (tee and sock, clean, stains gone) **stay ink black**;
the others are coloured. Left to right: ink tee, ink sock, pink shirt, mint
kurta, blue handkerchief (corner pegged as a diamond, bottom edges slightly
draped so it reads as cloth and not a kite), tan towel with fold lines. The
clothesline sock is IDENTICAL to the final S1 sock glyph, minus the stain.
Sanctioned echo: after the tee lands, one soap bubble drifts off and pops, once.

**9.4 Labels printed ON the garments** (no tags, strings or label row; the
tag-and-leader-line treatment is superseded): a small steel-blue number plus 2 or
3 words screen printed on the chest or flat area. Tee "01 book a pickup" (white
print on ink), shirt "02 we collect", kurta "03 partners clean", towel "04 back
in 24h". Sock and handkerchief stay unprinted dressing. Print must fit inside the
garment silhouette at every sway angle; text clipping past the edge is a defect.
**Printed garments get pendulum-dominant sway** (they rotate with the breeze with
minimal fabric warp, so text tilting up to 15 degrees stays legible);
**unprinted garments carry the expressive rippling.**

**9.5 Phase 1, assembly (pinned about 1.75 viewports, scrubbed, reversible).**
S3's pool drains, the rope's anchors draw the line in from the edges, and
garments eject one at a time from offscreen left: arc with a slight rotation,
land, the peg snaps with a small squash, **the rope dips, oscillates through 2 or
3 diminishing bounces, neighbours bounce sympathetically, and the sag deepens
slightly.** Continuous rope physics is the section's non-negotiable heart: a
rigid rope is a failed build. Step garments land left to right in step order with
dressing interleaved in the same stream, hero garments among the earliest.
Already-pegged garments begin idle sway immediately. Reverse scroll unpegs them
and flies them back out.

**9.6 Phase 2, alive (while the section is held).** An organic non-uniform
breeze: neighbours at different phases and amplitudes, never synchronized, never
visibly looping. The wind is weather rather than input. A soft push wanders along
the rope on two rates that do not divide into each other, so a wave travels the
catenary and each garment answers its neighbour a beat late; on top of that every
garment carries its own slow breath at its own rate. Cap: 15 to 20 degrees of
billow, a breeze and not a storm, with printed text readable at all times.
Measured in simulation, the rope wanders about 19 units of a 1200-unit scene and
the garments peak between 7 and 12.4 degrees, printed ones narrowest.

It blows for exactly as long as the page is held here. Off the hold the clock the
breeze is read from stops and the pendulums damp onto their last angle, so the
line stills rather than freezing: the difference between the wind dropping and
the page being paused.

**Tech (settled):** SVG plus a verlet rope with garment path displacement,
roughly 80% of a cloth sim, degrading to CSS pendulum sway on low-power devices.
A full cloth sim is not worth its cost here.

---

## 10. Section 5: press and fold, laundrylo Plus

```
DESKTOP beat 1 (press)          DESKTOP beat 3 (folded)
+--------------------------+    +--------------------------+
| 05 . THE FOLD            |    | 05 . THE FOLD            |
|  Folded into every order.|    |  Folded into every order.|
|   +--------------------+ |    |                          |
|   | ~ wrinkled shirt ~ | |    |      +-----------+       |
|   | +----+----+------+ | |    |      | laundrylo |       |
|   | |free|10% |prior-| | |    |      |   plus    |       |
|   | |pick|off |ity   | | |    |      +-----+-----+       |
|   | +----+----+------+ | |    |            | (string)    |
|   | |  CHEST PANEL   | | |    |         +--+---+         |
|   | +----------------+ | |    |         |₹99/mo|  tag    |
|   |   ( iron, steam )  | |    |         |GetPlus|        |
|   +--------------------+ |    |         +------+     (o) |
+--------------------------+    +--------------------------+
```

Personality: precise, geometric, satisfying. Right angles and clean creases after
S4's wind. Product rule (non-negotiable): Plus is real in the product, the
booking summary shows the discount line, and this section promises exactly the
three honoured perks.

**10.1 The object is a shirt, not a card.** Headline above: "Folded into every
order." A rounded rectangle with benefit chips is a failed build.

**10.2 Beat 1, the press.** The shirt arrives unfolded and creased: six wavy
lines in three pairs. A flat-illustrated iron enters and makes **three
crossings**, alternating direction, one along each band, turning round off the
edge of the box where the change of band cannot be seen.

Slowly. The iron carries 1220 units across a 960-unit box, so a crossing has the
whole width of the screen behind it, and at the rate it first ran that was a
quarter of a viewport of scrolling: a shove rather than a press. Ironing is a
deliberate gesture and this is the one section on the page that should look
unhurried. The hold grew with it, so the folds after it kept their room.

**Each crease goes out under the plate passing over it**, not on a timer of its
own. The crossing runs at constant speed, so the share of it at which the iron
meets the near end of a crease and the share at which it leaves the far end are
arithmetic; the crease is normalised to a path length of one and rubbed out over
exactly that stretch, from the end the iron reaches first. Creases are painted
over the cloth, not under it: underneath every panel they were invisible.

**Steam rises off the shirt at the lip of the plate**, on both sides and outside
the iron's own body, on its own repeating loop rather than on the scrubbed
timeline. It was drawn above the handle and scrubbed, which made it a wisp glued
to a lump of metal that shrank back into the nozzle on the way up.

**10.3 Beat 2, the fold (trigger based, about 800ms).** The pressed shirt lies as
four visible panels: **three carry one benefit each** (free pickup on every
order, 10% off all services, priority pickup slots) and **the fourth is the chest
panel.** Fold order as with a real shirt: left in, right over, bottom up, each a
clean rotation on its crease with flat-tone underside shading, landing with a
tiny crease-press settle. **Folded, the chest shows "laundrylo plus"** like a
printed tee, with "laundrylo" in the logo treatment and "plus" in Fraunces italic
amber. Creases stay faintly visible.

Trigger based rather than scrubbed: three sequential folds inside a single
viewport scrub badly, and the fold reads as a mechanism rather than a scroll
readout. Reversal on scroll up still unfolds, and irons the creases back in;
steam does not rewind, because it never sat on the timeline in the first place.

Per rule 4.9, **no content straddles a crease.** The v2.1 design had ₹99/month
and the CTA split across the vertical crease; in the shirt version they move to
the swing tag entirely, which resolves it.

**10.4 The swing tag.** Price and CTA live on a clothing price tag attached to
the folded shirt by a short string: "₹99/month" plus "Get Plus" in steel blue.
It swings in and settles after the final fold, and the CTA is interactive only
once assembled.

Restraint: no confetti, no shine sweep, no floating badges, no 3D beyond minimal
skew.

---

## 11. Section 6: deliver, footer

```
DESKTOP (full viewport, scene block vertically centred)
+-------------------------------------------------------------+
| 06 . THE DELIVER                                            |
|                                                             |
|  Cycle complete.                        \  flaps  /         |
|                                        +-----------+        |
|  You rode the whole cycle. Book        |===========|  tee   |
|  a pickup and get your first           |===========|  blue  |
|  weekend back.                         |===========|  pink  |
|                                        |===========|  mint  |
|  [ 560103 ] [ Find laundries -> ]      +-----------+ +---+  |
|                                        |   FRONT   |-|tag|  |
|                                        +-----------+ +---+  |
|                                          ~~ shadow ~~       |
| ----------------------------------------------------------- |
| laundrylo.   how it works . services . plus . terms .       |
|                                              github         |
| a demo project by ayush, not a real service.                |
|                        (o)  (c) 2026 laundrylo . back to top|
+-------------------------------------------------------------+
```

**11.1 Viewport rule.** S6 fills a full viewport like every other section (rule
4.10). If the scene and footer row do not naturally fill 100vh, the scene block
is vertically centred in the remaining space and the footer row sits at the
bottom. Never a short section with dead space below.

**11.2 Box construction, required improvements over the v2.1 design.** The v2.1
box reads as flat panels with a stack floating in front of it. Fix all of:

1. **The front panel must overlap the stack.** Draw the box in three layers: back
   wall and rear flaps behind, folded stack in the middle, **front panel and side
   walls in front, occluding the bottom 20 to 25% of the lowest garment**. The
   stack sits INSIDE the carton, not on it.
2. **Interior depth.** A darker tone step on the inner back wall and inner side
   walls (2 flat tones, no gradients) so the box reads as a container with
   volume.
3. **Flap geometry.** The v2.1 rear flap silhouette reads as a paper aeroplane.
   Use two rear flaps folded outward at a shallow angle, each with a visible
   thickness edge (a 2px darker strip along the fold) and a slight corner radius.
   Flaps must be visibly separate planes, not one continuous chevron.
4. **Stack legibility.** Five layers, each a distinct garment with a hint of
   construction rather than featureless bars: the ink tee on top with a visible
   collar notch and a faint sleeve seam; the others (powder blue, soap pink,
   mint, tan) each with one fold line. Vertical offsets are uneven by 2 to 3px so
   the stack looks hand folded, not machine stamped.
5. **The sock.** In v2.1 it is an ambiguous black blob at the box's side. Make it
   a recognizable sock (the same shape as the S1 glyph, minus the stain)
   **tucked into the box's near corner**, cuff visible above the front panel,
   foot angled inward: clearly the same object that was a letter, then hung on
   the line.
6. **Tag attachment.** The tag's string floats in v2.1. Anchor it: a peg clipped
   to the box's near flap edge, string running from the peg to the tag, tag
   hanging at a slight angle. Peg, string and tag are one connected assembly.
7. **Branding on the box.** The drum-o mark plus "BENGALURU" printed on the front
   panel is approved. Keep it, but scale the mark to roughly a third of the front
   panel's height so it reads as a printed logo rather than a label pasted on.

**11.3 Zone 1, the delivery.** Sign-off in Fraunces: "Cycle complete." Sub-line:
"You rode the whole cycle. Book a pickup and get your first weekend back."
Beneath it, the pin-code input and "Find laundries", the page's first ask made
once more (the same component, section 5.4). The tag reads "built by ayush",
links to GitHub, with an outbound arrow.

**11.4 Zone 2, the footer row.** One hairline rule (the page's only divider, rule
4.8); a small logo lockup; links with real destinations only: how it works
(anchors to S4), services (`/laundries`), plus (`/plus`), terms (`/terms`, a stub
page), github. The disclaimer is set plainly and unmissably:
**"a demo project by ayush, not a real service."** It is the honesty rule's
counterweight to the S3 figures, so it does not get set in fine print. Then
(c) 2026 laundrylo and a "back to the start" text link. No socials, no careers,
blog or press, no newsletter, no app badges, no invented company info.

**11.5 Arrival (trigger based, about 1s, plays once).** The box eases in from the
right and settles, the stack builds layer by layer with quick crease-press drops
(top last), the tag swings down through one pendulum swing and the peg clicks,
the sign-off resolves, and **the progress dial completes** with a quiet settle.
Rest: still, except the tag's 2-degree idle drift. Hovers: the tag lifts and
straightens, the top stack layer gives a tiny press, standard link underlines. No
back-to-top rocket; scrolling back up through the cycle IS the return trip.

---

## 12. Transition map

S1 to S2: the drain-wave curtain. S2 to S3: droplets pull from the still water
line as spin-up begins. S3 to S4: the pool drains and the clothesline is strung.
S4 to S5: the breeze stills and the iron enters. S5 to S6: the folded shirt
settles toward the stack and the box arrives. The dial fills throughout,
completing at S6. Every deterministic seam reverses (rule 4.3). No visual
dividers anywhere (rule 4.8).

---

## 13. Performance budget

Instant first paint on the S1 rest state: text LCP, inline SVG, zero image
requests in the hero. Fraunces is self-hosted, preloaded and `font-display: swap`.

**Loading strategy.** S1 and the scroll spine ship in the initial bundle. S2
through S6 are dynamic imports, prefetched one section ahead by an
IntersectionObserver, each with a 100vh placeholder reserved so nothing jumps and
`ScrollTrigger.refresh()` after each chunk mounts. GSAP, ScrollTrigger and Lenis
load after first paint; the static line is the placeholder for the physics.

60fps floor on mid-tier mobile. Degrade order: the rope solves only while its
section is on screen and the breeze only while it is held, droplet count halves,
shadows go static. Lighthouse 95 or better across the board.

---

## 14. Mobile specification (768px and below)

Mobile is not a fallback: most portfolio reviewers open links on a phone. Every
section keeps its concept, only the staging changes.

**14.1 Global mobile rules.**

1. Every section still fills exactly one viewport (100dvh, not 100vh, which
   avoids the iOS browser-chrome jump).
2. Pins are shortened by roughly 30% (thumb scrolling covers less pixel distance
   per gesture). If any pinned sequence feels long on a phone, cut beats, never
   speed them up.
3. All hover-only affordances have a touch equivalent or are dropped. No
   information lives behind hover.
4. Tap targets are 44px or larger; the pin input and CTA stack vertically, full
   width, in both S1 and S6.
5. Nothing is gated behind a cursor, because there is no cursor.
6. Ambient particle counts halve and shadows become static on low-power devices.
7. Type scales: display 2.75rem to 2rem for section headlines, S3 digits 15 to
   20vw becoming 22 to 26vw (they should still dominate).

**14.2 S1 mobile.** Single column: eyebrow, headline, machine (centred, about 55%
width), sub-line, input (full width), CTA (full width), micro-line. **The input
must remain within the first viewport**; if it does not fit, the machine shrinks,
never the input's position. The choreography still runs: letters fly from the
headline down and right into the machine below them (the arc direction rotates
about 90 degrees since the machine is beneath the text, not beside it). "SCROLL
TO WASH" persists.

**14.3 S2 mobile.** Cards stack 2x2 if they fit at 140px height each, otherwise a
single column of four with reduced internal padding. The drain curtain spans full
width and is proportionally taller (it is the section's only drama). Bubbles drop
from 4 to 2. The water line persists.

**14.4 S3 mobile.** The radial triangle compresses to a vertical arc: 24h (upper
left bias), 6 (centre), 52+ (lower right bias), retaining diagonal energy rather
than becoming a centred list. Droplet streaks shorten; the pool still accumulates
at the bottom edge. Digits stay enormous: this section must not become a modest
stat list on mobile.

**14.5 S4 mobile.** Rope sag deepens and the **garment count drops to five** (tee,
sock, shirt, kurta, towel; the handkerchief is cut) rather than shrinking
garments below recognizability. Printed text sizes up relative to the garment so
it stays legible. Assembly still scrubs, and the breeze runs while the section
is held exactly as it does on a desktop: it is weather, not an interaction, so
there is nothing to make discoverable. Shadows persist but are static.

**14.6 S5 mobile.** The shirt folds in a simpler **two-step** (halves, not
quarters) if four panels crowd the narrow screen: benefits ride the upper half,
the chest panel the lower. The iron pass shortens to one sweep. The swing tag
hangs below and to the right of the folded shirt rather than beside it. The CTA
is full width beneath the tag if the tag's own button falls below 44px.

**14.7 S6 mobile.** Vertical order: eyebrow, "Cycle complete.", sub-line, input,
CTA, box scene (centred, about 70% width), hairline, footer links (two rows,
wrapped), disclaimer, copyright and back to the start. The box keeps all
construction requirements from section 11.2 at reduced scale; if the sock tuck
becomes illegible below about 120px box width, drop the sock rather than render
it as a blob. The section still fills one viewport.

---

## 15. Accessibility floors

All information is real DOM text (printed garment steps, digits, benefits,
disclaimer); illustration never carries information that text does not. Reduced
motion renders every section complete and static. Keyboard: visible focus rings
site wide, pins never trap focus, and the CTA is reachable at both ends of the
page. Touch parity: nothing is hover-gated and nothing needs a pointer, because
no part of the cycle is driven by one.
Contrast: printed garment text meets 4.5:1 against its garment, and steel blue
meets 4.5:1 on paper.

---

## 16. Build order

All eight steps are built. The order they were built in, and what each one
covers:

1. Scroll spine and section skeletons with plain content. Deploy early, progress
   public.
2. S1 rest state (final glyphs, machine SVG, Fraunces) plus a rough pin and scrub
   to validate feel.
3. S1 full choreography (letter stream, starch, pour, early headline).
4. S4 static composition (rope, garments, prints, shadows).
5. S4 physics and breeze (hardest, likely two sessions).
6. S3 (digits, droplets, pool) and S5 (press, fold, tag).
7. S2 polish, S6 (box construction), dial, loader, transitions.
8. Mobile pass, performance pass, reduced-motion audit.

Standing rule: interview-prep reps come first, this project is the reward. The
app (listings and booking) is a parallel build sharing design tokens, the
pin-input component and the service filter.

What is verified and what is not: types, lint, stylelint, formatting, the test
suite and the production build run in CI. Motion is not covered by any of
them, because happy-dom has no layout and the spine never boots there. Every
test therefore sees the same static state that prefers-reduced-motion produces,
which is worth knowing when reading them: they prove the page says everything it
has to say, not that it moves well. That part is a browser judgement.

---

## 17. Open items

- The background tint whisper (section 3) is A/B'd at build.
- The glyph fallback (both glyphs in "lost") is used only if the duplicate l
  reads as inconsistent.
- No data seam remains in S2: its canonical service ids match the API vocabulary,
  while partner-specific prices are derived from each catalogue.

Everything else that stood open in v2.1 is settled in section 19.

---

## 18. Acceptance checklist (verify in motion)

**S1:** scrub driven and reversible, squint test passes (the sock reads as an l,
the tee as a t), the trail never piles, text never holds holes, liquid only
inside the glass, the clean headline is present through the second half, the
input is clickable throughout.

**S2:** curtain, droplets and bubbles on entry, then stillness; the curtain
settles to a hairline rather than sitting as a band; cards mask-reveal bottom up;
hover motion is one shot; each card lands on the listing filtered by its service.

**S3:** the figures are already spinning as they come up the screen, they land
once and are never disturbed again in either direction, absolute-velocity drive
on the drum and the spray, the
emission floor is visible at slow scroll, the pool grows then drains into S4 and
refills on return, the corner dial is hidden while the drum is on screen.

**S4:** rope physics on every landing (a rigid rope is a failed build), prints
readable and inside the silhouette at max billow, the breeze runs while
stationary and stills when the hold releases, shadows track the sway.

**S5:** the object is a shirt, press precedes fold, every crease goes out under
the iron rather than on a timer, steam leaves the cloth and not the handle, fold
order is left, right, bottom, the chest reveal reads "laundrylo plus", nothing
straddles a crease, the tag CTA is inert until assembled.

**The tour:** plays from the top whatever the scroll position, holds a constant
pace through every phase, and gives way on the first wheel, swipe or scrolling
key without jumping.

**S6:** full viewport, the stack sits inside the box (the front panel occludes),
flaps read as separate planes, the sock is recognizable, tag, peg and string are
connected, arrival plays once, the dial completes, every link resolves.

**Global:** no separators anywhere, reduced-motion parity, 60fps, no real blur in
motion, the mobile spec (section 14) satisfied per section, and the journey
renders in the paper theme regardless of the OS dark preference.

---

## 19. Build decisions

Settled 2026-08-24, before implementation.

1. **Built in this repo** as the lazy `/journey` route in the React 18 and
   Webpack SPA. No Next.js rebuild. The token layer, pin-input component and app
   routes already exist here, and SSR buys little for a page whose LCP is text.
2. **Per-item prices** on the S2 cards, read from `SERVICE_TYPES`. Per-kg was
   retired product wide (see [prd.md](./prd.md) section 5), and rule 4.6 requires
   the cards to match the booking flow.
3. **The S3 figures stay at 52+, 6 and 24h**, carried by the footer disclaimer.
   Design intent over seed accuracy for a showcase. The disclaimer is the honesty
   rule's counterweight, which is why it is set unmissably rather than in fine
   print.
4. **The journey is light only.** The theme toggle is absent on `/journey` while
   product routes keep both themes. Rule 3 bans dark sections: the paper world
   is the concept, not a preference.
5. **The shared header and footer are not rendered on `/journey`.** The route
   carries a minimal non-sticky header (logo plus tour), and S6 is the footer. A
   sticky header would eat a 100vh section.
6. **Serviceability resolves in the listing.** Any valid 6-digit pin navigates;
   the API-backed listing renders an honest empty state when nobody serves it.
7. **The service filter ships.** The listing sends the service slug to the API,
   shows a removable chip, and cards fall back to a default seeded pin when the
   visitor has not entered one. Rule 7.3 requires the cards to land somewhere
   filtered. See [api-contract.md](./api-contract.md) decision 7.
8. **Fraunces self-hosted, four axes, journey only.** Body stays Inter, and app
   routes keep Bricolage Grotesque. Section 6.4 needs SOFT and WONK, which
   Google's CSS2 slice drops, and scoping the font to `/journey` keeps the app's
   payload unchanged.
9. **S4 wind: a verlet rope with path displacement.** Roughly 80% of a cloth sim
   at a fraction of the cost, and it degrades cleanly to CSS sway.
10. **S5 fold: trigger based, about 800ms.** Three sequential folds inside one
    viewport scrub badly, and the fold reads better as a mechanism than as a
    scroll readout.
11. **S3 keeps the drum at its centre**, and the corner dial hides while S3 is in
    view. The drum is the centrifuge's axis; two water circles at once read as a
    bug.
12. **Superseded after the route split:** the product header keeps the homepage
    anchors (`#services`, `#how-it-works`, `#pricing`) and does not advertise the
    journey. `/journey` owns its minimal two-item header.
13. **Hinges and pivots live in the timelines, not the stylesheets.** GSAP
    computes its own transform origin for SVG and overrides `transform-origin`,
    so anything turning about a point other than its middle declares it as an
    `svgOrigin` in viewBox coordinates. The door opening from its centre rather
    than its left edge was this bug, and the fold panels were written against it
    from the start.
14. **S3 digits run at 10.5vw rather than the 15 to 20vw in section 8.1.** At the
    larger size the three figures crowded the drum on the axis between them.
    Revisit if the composition ever gets more room.
15. **"plus" on the folded shirt is a synthesised oblique.** Self-hosting a
    second 120KB font file for one word is not worth it; swap in real Fraunces
    italic if the fold ever grows more of them.
16. **Every phase pins and scrubs.** Arriving at a section holds it in place, and
    the scrolling that follows is what runs its choreography. This is the page's
    single motion model, in `motion/pinScene.ts`, and the pin lengths there and
    in each hook are where the pacing of the whole page is set. It replaced a
    mix of three models: scrubbed pins for the wash and the dry, play-on-enter
    for the rinse, the fold and the delivery, and scroll velocity for the spin.
    Only position-based motion reverses correctly, and only a hold makes a phase
    cost what it is worth.
17. **No scroll snapping.** There was, briefly. With every phase pinned the
    scroll is almost always inside a hold rather than between two of them, so
    snapping to the nearest section start hauls the page backwards through an
    animation the visitor is in the middle of. The holds are what stop a phase
    being skipped. The step and lookahead caps in `motion/spine.ts` are what stop
    a hard flick outrunning them, and the lookahead is the one doing the work:
    it caps how far ahead of the page the scroll may run, rather than capping how
    hard the visitor is allowed to push.
18. **Scene transforms that run every frame are written to the attribute, not
    set through GSAP.** `svgOrigin` is resolved against the scene's own
    coordinate system, so `'0 0'` means the corner of the drawing rather than the
    corner of the element. Every garment on the line was swinging about the
    corner of the scene, which threw it further the further along the line it
    hung: measured, the towel at the right end moved about two hundred units for
    a fifteen degree flutter, which is what "the clothes detach from the rope"
    was. `rotate` written to the attribute with no centre is the element's own
    origin, which is the peg. The same applies to the spinning drum.
19. **Wind was gathered per frame, not per event.** A pointer fires anywhere
    between sixty and two hundred and forty moves a second depending on the
    hardware, so a push per event made the same sweep four times stronger on a
    better mouse. Superseded by decision 20, which removed the pointer wind
    altogether; the reasoning is kept because it applies to any continuous input,
    and the frame-scaling it argues for is what the ambient breeze now uses.
20. **The pointer is not the wind. The line moves by itself.** The cursor became
    a swirl inside S4 and sweeping it pushed a gust that travelled the rope. It
    was the best interaction on the page and almost nobody found it: nothing on
    the screen tells a visitor to sweep a mouse across a drawing, so the one part
    that asked to be played with read as the one part that was broken. The
    breeze is ambient now, and because it is no longer competing with a gust the
    visitor owns, it can be as wide as washing on a line actually moves: 9.5
    degrees of target sway against the 4.2 it was held to before. It blows only
    while the section is held, which is both the honest reading (the phase is
    what is playing) and the cheap one.
21. **The spin starts on sight, not on the hold.** A section is held when its top
    reaches the top of the window, and the figures are readable for most of a
    viewport before that. Started on the hold, three still numbers rode up the
    screen and broke into a spin the instant the page stopped, which put the
    whole performance after the thing it was meant to introduce and made the
    spin look like a reaction to the lock. `onceInView` fires at `top 75%`.
22. **A crease goes out under the iron, not on a timer.** The press faded every
    crease together over 1.4 seconds while the iron crossed twice somewhere
    nearby. It now makes three crossings, one per band of creases, and each
    crease is rubbed out over exactly the stretch of the crossing during which
    the plate is over it, computed from the constant crossing speed rather than
    approximated. Two things were wrong underneath: the iron's two passes only
    covered the middle of the shirt, and the creases were painted before the
    panels, so opaque cloth hid three of the five completely and clipped the
    other two to the chest column. The dash offset is animated as an attribute
    rather than a style, so a bare number is a user unit and there is nothing to
    argue about.
23. **The header plays the cycle rather than linking into it.** "How it works"
    pointed at S4, which answered the question by dropping the visitor into the
    middle of the answer with the wash, the rinse and the spin already behind
    them and no sign they had ever been there. It plays the whole thing instead,
    from the top, at a constant 0.36 viewports a second: every phase is scrubbed
    against the scroll, so scroll speed is playback speed and one number paces
    the film. Expressed in viewports rather than pixels because the holds are.
    It gives way on the first wheel, swipe or scrolling key, handing back at the
    position reached: Lenis is stopped and started, which resets its target to
    where the page actually is, and this runs before Lenis acts on the gesture
    so the nudge is measured from there rather than from the bottom of the page.

    It moves the page through `scrollTo`, re-aimed whenever the document grows.
    Both halves of that were learned the hard way. `lenis.targetScroll` is
    bookkeeping rather than a setpoint, and the animation behind it returns on
    its first line unless a `scrollTo` started it, so a tour that advanced the
    target by hand moved a number nobody reads and did nothing at all. And there
    is no fixed bottom to aim at: the scenes are lazy, and each one that mounts
    pins its section and inserts a spacer, so a tour aimed once from the top
    stops about a fifth of the way down.

24. **The page is paced by its holds, and a hard scroll has a speed limit.**
    Every hold carries a factor of 1.15 over what it was first built at. There
    is no separate speed control and there should not be one: a phase is
    scrubbed against its own hold, so a longer hold is the same choreography
    played more slowly, and lengthening the hold is the only honest way to slow
    a phase down. The relative lengths are the deliberate part; the factor is
    uniform, so pacing the page again is one number in six places. Two phases
    carry more than the factor on their own account: the wash, for the pour
    (1.295), and the fold, for the iron (1.433). The page runs about 16.9
    viewports where it ran 14.65.

    Separately, the lookahead cap in `motion/spine.ts` went from 0.9 of a
    viewport to 0.55, which is a speed limit in disguise. Lenis closes the gap
    between where the page is and where the scroll wants it exponentially at a
    rate its lerp sets, so the fastest the page can move is that rate times the
    widest the gap may be: 0.9 allowed nearly five and a half viewports a second
    and 0.55 allows about three and a third. A phase crossed at the old speed is
    a phase nobody saw. Ordinary scrolling never opens a gap that wide and is
    untouched by either change.

## 20. Living beside the homepage

The journey is a second telling of the same story, so the two pages can disagree,
and a disagreement between them is not a bug anyone would notice. It would simply
be the site quoting two different numbers for the same thing, on two pages,
forever. It had already happened once: the homepage claimed five hundred partner
laundries while the journey counted fifty two.

So neither page owns the shared facts.

| Fact                          | Written in                     | Read by                                                  |
| ----------------------------- | ------------------------------ | -------------------------------------------------------- |
| The four steps                | `cycleConfig.ts`, `DRY.steps`  | the journey's dry phase, the homepage's How It Works     |
| The three figures             | `cycleConfig.ts`, `SPIN.stats` | the journey's spin phase, the homepage hero              |
| The services and their prices | `data/services.ts`             | both pages, the listing, the cart                        |
| The Plus perks and price      | `membershipConfig.ts`          | both pages, the Plus page, the cart, the booking summary |

What each surface adds is its own: the homepage attaches an icon and a sentence
of explanation to each step, and the journey prints the step on a garment. The
step itself, and the order the steps come in, are written once.

`App.test.tsx` asserts the agreement rather than trusting it, because the failure
mode here is silent by nature.

**What the split costs.** `cycleConfig.ts` is now in the entry bundle, because
the homepage reads two values out of it. It is copy and numbers with no imports
that survive compilation, so the entry did not grow. The journey itself is a lazy
route and GSAP and Lenis stay in the async `motion` chunk, so no app route pays
for any of it. Fraunces is no longer preloaded from `index.html`: only the
journey sets type in it, and a hundred and twenty kilobyte display face fetched on
every route to serve one page nobody has asked for yet is not a trade worth
making. The `@font-face` rule costs nothing until a glyph needs it.

**What the journey does not share.** Its own chrome. It suppresses the app header
and footer (`Layout.tsx` keys off `ROUTES.journey`) and carries a two-item header
and its own footer, because the app chrome would be a third voice on a page meant
to read as one. It also locks the theme to light, which is why `ThemeToggle`
hides itself while a lock is held: a dark wash cycle is a different design, not a
variant of this one.
