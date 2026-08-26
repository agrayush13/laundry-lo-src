import { SPIN } from '../config/cycleConfig';
import { DRUM_MARK } from '../common-ui/drum-mark/drumGeometry';
import { onceInView, pinScene, whileVisible } from '../motion/pinScene';
import { useSceneMotion } from './useSceneMotion';

/** How long the spin holds the page while the numbers come up. */
const PIN_LENGTH = '+=150%';
const PIN_LENGTH_MOBILE = '+=109%';

/** Progress per second that counts as spinning flat out. */
const FULL_TILT = 1.1;
/** How fast the drum answers a change in scroll speed, per second. */
const RESPONSE = 7;

/** Degrees per second for the drum on its axis, idling and flat out. */
const IDLE_DRUM = 46;
const DRIVEN_DRUM = 760;

/**
 * Digit faces each strip travels before it lands.
 *
 * Multiples of ten, so every strip arrives back on the face it started from,
 * which is the face this number has always been. Different totals mean the three
 * figures do not roll in lockstep even though they settle together.
 */
const TURNS = [30, 50, 40];

/** How far the figures dim while they roll. Never a filter: that is a repaint. */
const MAX_FADE = 0.32;
/** Below this the drum is idling and the figures do not move at all. */
const IDLE = 0.06;

/**
 * How long the figures spin for on arriving at the section, in seconds.
 *
 * Coming to a stop is the point of this section, and something has to be moving
 * before it can stop. Coming into view is what starts them: the reel whips,
 * decelerates and lands on the figure it has always been. It is the only thing
 * that ever moves them, and it happens once a visit.
 *
 * It starts on sight rather than on the hold, because the figures are readable
 * for most of a viewport before the section is held. Waiting for the hold meant
 * watching three still numbers ride up the screen and then break into a spin the
 * instant the page stopped, which put the whole performance after the thing it
 * was meant to introduce.
 *
 * Nothing the scrolling does afterwards touches them, up or down. A statistic
 * that re-rolls every time it is scrolled past is a slot machine rather than a
 * fact, and one driven by scroll speed cannot even be trusted to land on itself.
 * The scroll still drives the drum, the spray and the water; the figures are the
 * one part of the section it has no say over.
 */
const SPIN_UP = 1.7;

/**
 * How far a drop gets, as a share of the distance from the axis to the edge of
 * the section along the line it was thrown down.
 *
 * Water leaves a spinning drum radially: every direction, straight out, and the
 * only thing that varies is how far it gets before it runs out. Measuring the
 * reach against the boundary in that direction rather than as a flat radius is
 * what fills the section instead of stamping a circle in the middle of it.
 */
const REACH = { least: 0.5, most: 1.08 };
/** How far a drop may stray from the angle it was given. */
const WANDER = 10;

/**
 * How long a drop is in the air, and where in the cycle it sets off.
 *
 * The phase steps by the golden ratio rather than by the drop's place in the
 * fan. Running the phase in step with the angle put every drop a little further
 * out than the one beside it, and the spray resolved into a single spiral arm:
 * the drum looked like it was throwing water from one spot that happened to be
 * turning, rather than from all the way round. Stepping by the golden ratio puts
 * neighbouring angles at opposite ends of the cycle, so at any instant there is
 * water at every distance in every direction.
 */
const PHASE = 0.618034;
const FLIGHT = { least: 1.15, most: 1.7 };

/** How full the pool is at rest, and what one landed drop adds to it. */
const POOL_FLOOR = 0.12;
const DROP_VOLUME = 0.04;

/**
 * How full the drum is by the end, and how far the water tips at full tilt.
 *
 * The level is a translation, not a scale: scaling the water body about the
 * drum floor would stretch the wave on its surface along with it, and a swell
 * that grows as the drum fills is a graph of a fill level rather than water.
 * The lean is a rotation about the drum's own centre, so the water rides up the
 * wall the drum is carrying it up and settles flat the moment the scrolling
 * stops. It gathers at the bottom because that is the only place it can be when
 * nothing is throwing it anywhere.
 */
const FULL_DRUM = 0.62;
const MAX_SLOSH = 26;
const DRUM_RISE = (FULL_DRUM - DRUM_MARK.restingWater) * DRUM_MARK.innerRadius * 2;
const DRUM_CENTRE = `${DRUM_MARK.centre.x} ${DRUM_MARK.centre.y}`;

/**
 * The markup hooks the spin drives, and the source of every selector below.
 *
 * The scene must render all of them. It did not render the drum's, once, and the
 * result was a section that looked broken in a way nothing failed over: the
 * rotation was applied to a node that was not there, so the drum sat still while
 * every other part of the spin worked. Contract-tested against the scene.
 */
export const SPIN_PARTS = [
    'slot',
    'droplet',
    'drum-holes',
    'drum-water',
    'pool',
    'pool-drain',
] as const;

const part = (name: (typeof SPIN_PARTS)[number]) => `[data-spin="${name}"]`;

/**
 * The spin. Arriving pins the section, and the scrolling that follows is the
 * motor: the drum turns, the digits blur past as slot strips and land on the
 * figures they have always been, the water wrung out of them falls, and it
 * gathers in the bottom of the drum and in the pool under the section.
 *
 * Position, not velocity. Everything here is a function of how far into the hold
 * the page is, so scrolling back up unwinds it exactly and a number can never be
 * left half-rolled. Only the drum's own rotation is free-running, because a drum
 * that stops dead the instant the scrolling does is a picture of a drum.
 */
export const useSpin = () =>
    useSceneMotion(SPIN.meta.id, ({ gsap, ScrollTrigger, section }) => {
        // The window, not the strip inside it: the window is one digit tall, so
        // it is the only box a stretch can be applied to without throwing the
        // digit out of view, and --slot inherits down to the strip from here.
        const slots = gsap.utils.toArray<HTMLElement>(part('slot'));
        const droplets = gsap.utils.toArray<HTMLElement>(part('droplet'));
        const holes = section.querySelector<SVGElement>(part('drum-holes'));
        const water = section.querySelector<SVGElement>(part('drum-water'));
        const pool = section.querySelector<HTMLElement>(part('pool'));
        const drain = section.querySelector<HTMLElement>(part('pool-drain'));

        const faces = slots.map((slot) => Number(slot.dataset.digit ?? 0));

        let onScreen = false;
        let progress = 0;
        let lastProgress = 0;
        /** How hard the drum is being turned right now, from 0 to 1, smoothed. */
        let drive = 0;
        let angle = 0;
        /** Seconds of arrival spin still to run, counted down by the ticker. */
        let winding = 0;
        /** How full the pool under the section is, from 0 to 1. */
        let pooled = POOL_FLOOR;

        // The spray is anchored on the drum, and the drum is a grid cell whose
        // position depends on how tall the figures either side of it come out.
        // Measured rather than assumed, and re-measured on every refresh,
        // because a resize moves it.
        //
        // The mark's box is not the drum: the wordmark's dot takes the top of it,
        // so the drum's own centre sits about a tenth of the box low. Taking the
        // middle of the box would hang the whole spray above the thing throwing
        // it. Its width is the drum though, because the ring's outer edge is
        // exactly half the box across.
        const axis = water?.ownerSVGElement ?? null;
        const CENTRE_Y = DRUM_MARK.centre.y / DRUM_MARK.height;
        const spray = () => {
            const bounds = section.getBoundingClientRect();
            const drum = axis?.getBoundingClientRect();

            return {
                x: drum ? drum.left + drum.width / 2 - bounds.left : bounds.width / 2,
                y: drum ? drum.top + drum.height * CENTRE_Y - bounds.top : bounds.height / 2,
                radius: drum ? drum.width / 2 : 60,
                width: bounds.width,
                height: bounds.height,
            };
        };

        // Each droplet flies on its own loop rather than on the timeline: the
        // water is weather, and weather does not stop because the page did.
        const falls = droplets.map((droplet, index) => {
            const heading =
                ((Number(droplet.dataset.angle ?? 0) + gsap.utils.random(-WANDER, WANDER)) *
                    Math.PI) /
                180;
            const cos = Math.cos(heading);
            const sin = Math.sin(heading);
            const share = gsap.utils.random(REACH.least, REACH.most);

            // How far the edge of the section is along this heading. The drop is
            // given a share of that, so one thrown sideways travels further than
            // one thrown at the floor, which is what a rectangle looks like when
            // it is filled from the middle.
            const edge = (at: ReturnType<typeof spray>) =>
                Math.min(
                    Math.abs(cos) > 1e-3 ? Math.abs((cos > 0 ? at.width - at.x : at.x) / cos) : 1e5,
                    Math.abs(sin) > 1e-3 ? Math.abs((sin > 0 ? at.height - at.y : at.y) / sin) : 1e5
                );

            // Leaves the rim, not the middle: a drop that fades up out of the
            // drum's own face has not been thrown off anything.
            const from = (axisName: 'x' | 'y') => () => {
                const at = spray();
                return at[axisName] + (axisName === 'x' ? cos : sin) * (at.radius + 3);
            };
            const to = (axisName: 'x' | 'y') => () => {
                const at = spray();
                const reach = at.radius + edge(at) * share;
                return at[axisName] + (axisName === 'x' ? cos : sin) * reach;
            };

            // Facing the way it is going, tail behind it.
            //
            // The drop is drawn nose down, so a rotation has to carry its local
            // down onto the heading. A css rotation takes (0, 1) to (-sin, cos),
            // which is where the minus sign comes from: without it the drop is
            // mirrored, and while that is invisible on a symmetric dash going
            // straight down or straight sideways, at forty five degrees it lies
            // ninety degrees across its own path.
            const lean = (Math.atan2(-cos, sin) * 180) / Math.PI;

            // Left to drift rather than locked to a common cycle, so the ring
            // never re-forms into a pattern that beats in time with itself.
            const flight = gsap.utils.random(FLIGHT.least, FLIGHT.most);

            return gsap
                .timeline({ repeat: -1, delay: ((index * PHASE) % 1) * flight })
                .set(
                    droplet,
                    { x: from('x'), y: from('y'), scaleY: 1, opacity: 0, rotation: lean },
                    0
                )
                .to(droplet, { opacity: 1, duration: 0.14 }, 0)
                .to(
                    droplet,
                    {
                        x: to('x'),
                        y: to('y'),
                        scaleY: 1.9,
                        duration: flight,
                        ease: 'power2.out',
                        // It came off the load, so the pool is deeper for it.
                        // The tick decides whether the section has been scrolled
                        // far enough to have shed this much water yet.
                        onComplete: () => {
                            pooled += DROP_VOLUME;
                        },
                    },
                    0
                )
                .to(droplet, { opacity: 0, duration: flight * 0.3 }, flight * 0.7);
        });

        const tick = (_time: number, delta: number) => {
            if (!onScreen) {
                return;
            }

            const seconds = Math.max(Math.min(delta / 1000, 1 / 30), 1 / 240);
            const rate = Math.abs(progress - lastProgress) / seconds;
            lastProgress = progress;

            drive += (Math.min(1, rate / FULL_TILT) - drive) * Math.min(1, seconds * RESPONSE);

            // The arrival spin winds down on its own clock. Squared rather than
            // linear, so it whips at the start and eases onto the figure instead
            // of stopping dead on it.
            winding = Math.max(0, winding - seconds);
            const wind = (winding / SPIN_UP) ** 2;

            // Anything slower than this is somebody reading, not scrolling.
            const push = Math.max(0, (drive - IDLE) / (1 - IDLE));

            // What the section looks like it is doing, from either cause. The
            // drum, the water and the spray all answer to this, so arriving
            // sets the whole thing going and so does scrolling. The figures do
            // not: see below.
            const whirl = Math.max(push, wind);

            // The drum keeps its own time and the scroll only leans on it. The
            // perforations are what carry the rotation: a bare ring turning
            // about its own centre is identical at every angle.
            //
            // Rotation is written straight to the attribute. GSAP resolves an
            // SVG transform origin against the whole scene's coordinates, so
            // svgOrigin here would turn the drum about the corner of the page.
            angle = (angle + (IDLE_DRUM + whirl * DRIVEN_DRUM) * seconds) % 360;
            holes?.setAttribute('transform', `rotate(${angle.toFixed(2)} ${DRUM_CENTRE})`);

            falls.forEach((fall) => fall.timeScale(0.55 + whirl * 2.4));

            // The water fills fast at first and creeps at the end.
            const eased = 1 - (1 - progress) ** 3;

            // Dimmed while the figures are actually rolling, and only then. A
            // landed number that softens every time the page moves is a number
            // that looks like it is about to change.
            const legible = (1 - wind * MAX_FADE).toFixed(3);

            slots.forEach((slot, index) => {
                // One thing moves a figure, and it happens once: the spin it
                // does on arriving. Nothing the scrolling does afterwards
                // touches it, in either direction, for the rest of the visit.
                //
                // Scrolling used to add to the roll for as long as the hold had
                // room for any, which is what "the numbers land and then move
                // again" was. It was never going to work. A figure has one true
                // value, so anything that moves it has to end on it, and a
                // quantity driven by scroll speed ends wherever the scrolling
                // stopped: park mid-roll and a crisp, confident, wrong number
                // sits on the screen. Coming to a stop is what this section is
                // about, and something that has stopped is not still arriving.
                const roll = TURNS[index % TURNS.length] * wind;

                // Wrapped into the first of the strip's two runs of 0-9, so the
                // window never scrolls off the end of it. The second run is what
                // makes the wrap seamless. The turns are multiples of ten, so
                // whatever the roll passes through, it lands back on the face it
                // started from.
                slot.style.setProperty('--slot', ((faces[index] + roll) % 10).toFixed(3));
                slot.style.setProperty('--legible', legible);
            });

            // Wrung out of the load, gathering in the bottom of the drum, and
            // leaning against the wall it is being carried up while the drum is
            // turning hard.
            const slosh = -drive * MAX_SLOSH;
            water?.setAttribute(
                'transform',
                `rotate(${slosh.toFixed(2)} ${DRUM_CENTRE}) translate(0 ${(-eased * DRUM_RISE).toFixed(2)})`
            );

            // The pool rises by the drop, and the scroll is its ceiling: water
            // arrives by falling, so the level steps up as each drop lands, but
            // it can never be deeper than the section has been scrolled, which
            // is what lets scrolling back up empty it again.
            if (pool) {
                pooled = Math.min(pooled, POOL_FLOOR + eased * (1 - POOL_FLOOR));
                pool.style.transform = `scaleY(${pooled.toFixed(3)})`;
            }

            // The pool belongs to this section, so it leaves with it: the last
            // of the hold drains it as the dry takes over.
            if (drain) {
                const draining = gsap.utils.clamp(0, 1, (progress - 0.86) / 0.14);
                drain.style.transform = `scaleY(${(1 - draining).toFixed(3)})`;
            }
        };

        gsap.ticker.add(tick);

        // The hold is the motor; being on screen is what decides whether the
        // weather runs. They are different windows: the section is visible for a
        // viewport before its hold begins and for one after it releases.
        whileVisible(ScrollTrigger, section, (visible) => {
            onScreen = visible;
            falls.forEach((fall) => (visible ? fall.resume() : fall.pause()));
        });

        // The figures are set going by being seen, not by being held. Once
        // only: a statistic that re-rolls every time it is scrolled past is a
        // slot machine rather than a fact.
        onceInView(ScrollTrigger, section, () => {
            winding = SPIN_UP;
        });

        pinScene(ScrollTrigger, {
            section,
            length: PIN_LENGTH,
            mobileLength: PIN_LENGTH_MOBILE,
            scrub: 0.6,
            onProgress: (value) => {
                progress = value;
            },
        });

        return () => gsap.ticker.remove(tick);
    });
