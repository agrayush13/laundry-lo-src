import { ScrollSpine } from './spine';

type Gsap = ScrollSpine['gsap'];

/**
 * The wash, as one scrubbed timeline. Times are in timeline seconds and the pin
 * maps them onto scroll distance, so they read as a score rather than as
 * scroll percentages: door, garments, letters, close, pour, the clean line, spin.
 *
 * The pour takes about seventy per cent longer than it first did. The cup tipped
 * and both ribbons fell through the glass inside a viewport and a half of
 * scrolling, which is the same distance the door takes to open, and detergent
 * that arrives that fast reads as a flicker rather than as a pour. The hold was
 * lengthened by the same proportion the score was, so every other beat costs
 * exactly the scroll it always did and only the pour is slower.
 */
const SCORE = {
    doorOpen: { at: 0, duration: 0.8 },
    glyphs: { at: 0.45, gap: 0.33 },
    letters: { at: 1.3, stagger: 0.085 },
    flight: 0.95,
    doorShut: { at: 4.9, duration: 0.6 },
    cup: { at: 5.3, tip: 5.55, duration: 0.72 },
    drawer: { at: 5.95, duration: 0.6 },
    ribbonPink: { at: 6.4, duration: 1.7, fade: 0.9 },
    ribbonBlue: { at: 7.5, duration: 1.7, fade: 0.9 },
    water: { at: 6.4, duration: 3.2, rise: -78 },
    foam: { at: 6.9, duration: 0.5 },
    clean: { at: 6.2, stagger: 0.34, duration: 0.55 },
    spin: { at: 9.7, duration: 1.2 },
    total: 11.3,
} as const;

/**
 * The parts of the scene the wash reaches for. Exported so the markup and the
 * choreography can be checked against each other: a renamed hook on either side
 * would otherwise fail silently, with letters flying to the top-left corner.
 */
export const WASH_PARTS = [
    'door',
    'cup',
    'drawer-tint',
    'ribbon-pink',
    'ribbon-blue',
    'water',
    'foam',
    'swirls',
    'drum-bubbles',
] as const;

/**
 * Hinges and pivots, in the machine's own viewBox coordinates.
 *
 * GSAP computes its own transform origin for SVG and defaults to the centre of
 * the element's bounding box, which overrides any `transform-origin` in the
 * stylesheet. Anything that turns about a point other than its middle has to say
 * so here, or the door opens from its centre like a pair of curtains.
 */
const PIVOT = {
    /** The left edge of the door ring: centre 240, radius 128, stroke 22. */
    door: '101 330',
    /** The cup's bottom lip, which it tips over into the drawer. */
    cup: '114 72',
    drum: '240 330',
} as const;

/** Cloth the letters turn into, in the order they take it. */
const SCRAPS = ['--cloth-pink', '--cloth-mint', '--cloth-blue', '--cloth-amber'];

/**
 * Stable per-letter variation. Deterministic on purpose: a scrubbed sequence has
 * to land in the same place every time it is scrolled past, and Math.random
 * would reshuffle the arcs on every refresh.
 */
const wobble = (index: number, spread: number) => {
    const noise = Math.sin(index * 12.9898) * 43758.5453;
    return (noise - Math.floor(noise) - 0.5) * 2 * spread;
};

interface Letter {
    el: HTMLElement;
    ink: HTMLElement | null;
    scrap: HTMLElement | null;
    line: number;
    /** Position in the departure order; the garments leave first. */
    order: number;
}

const readLetters = (root: HTMLElement): Letter[] => {
    const lines = Array.from(root.querySelectorAll<HTMLElement>('[data-wash="line"]'));

    const letters = lines.flatMap((line, lineIndex) =>
        Array.from(line.querySelectorAll<HTMLElement>('[data-wash="letter"]')).map((el) => ({
            el,
            ink: el.querySelector<HTMLElement>('[data-wash="ink"]'),
            scrap: el.querySelector<HTMLElement>('[data-wash="scrap"]'),
            line: lineIndex,
            order: 0,
        }))
    );

    // The garments detach first, then everything else in reading order.
    const departures = [
        ...letters.filter(({ el }) => el.dataset.glyph),
        ...letters.filter(({ el }) => !el.dataset.glyph),
    ];
    departures.forEach((letter, index) => {
        letter.order = index;
    });

    return departures;
};

export interface WashTimeline {
    timeline: gsap.core.Timeline;
    /** Drops the measurement cache so a refresh re-reads the new layout. */
    invalidate: () => void;
}

export const buildWashTimeline = (gsapInstance: Gsap, root: HTMLElement): WashTimeline => {
    const letters = readLetters(root);
    const drum = root.querySelector<SVGElement>('[data-wash="drum-bubbles"]');
    const timeline = gsapInstance.timeline({ paused: true });

    interface Measurement {
        width: number;
        x: number;
        y: number;
    }

    let measured: { letters: Measurement[]; drum: { x: number; y: number } } | null = null;

    /**
     * One pass over the layout, cached until something invalidates it. The
     * caller drops the timeline to its start before letting this run again, so
     * the rectangles read here are always the letters at rest rather than
     * mid-flight. `offsetWidth` is layout width and ignores transforms, which is
     * what the line needs to know to close up.
     */
    const measure = () => {
        if (measured) {
            return measured;
        }

        const drumRect = drum?.getBoundingClientRect();

        measured = {
            letters: letters.map(({ el }) => {
                const rect = el.getBoundingClientRect();
                return {
                    width: el.offsetWidth,
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2,
                };
            }),
            drum: drumRect
                ? { x: drumRect.left + drumRect.width / 2, y: drumRect.top + drumRect.height / 2 }
                : { x: 0, y: 0 },
        };

        return measured;
    };

    // Letters land inside the drum, not on a single point in it: a pile is the
    // failure mode this scatter exists to avoid.
    const target = (index: number) => {
        const { letters: rects, drum: centre } = measure();
        const rest = rects[index];
        return {
            x: centre.x - rest.x + wobble(index, 26),
            y: centre.y - rest.y + wobble(index + 100, 26),
        };
    };

    const departureAt = (letter: Letter) =>
        letter.order < 2
            ? SCORE.glyphs.at + letter.order * SCORE.glyphs.gap
            : SCORE.letters.at + (letter.order - 2) * SCORE.letters.stagger;

    letters.forEach((letter, index) => {
        const at = departureAt(letter);
        const { flight } = SCORE;
        const rise = flight * 0.42;

        // The line closes up as the letters ahead of it leave, so what remains
        // always reads as shrinking text rather than text full of holes.
        const earlier = letters.filter(
            (other) => other.line === letter.line && other.order < letter.order
        );

        if (earlier.length > 0) {
            const opensAt = departureAt(earlier[0]);
            timeline.fromTo(
                letter.el,
                { x: 0 },
                {
                    x: () =>
                        -earlier.reduce(
                            (total, other) => total + measure().letters[other.order].width,
                            0
                        ),
                    duration: Math.max(at - opensAt, 0.001),
                    ease: 'none',
                },
                opensAt
            );
        }

        timeline
            .to(letter.el, { x: () => target(index).x, duration: flight, ease: 'none' }, at)
            .to(
                letter.el,
                {
                    y: () => target(index).y * 0.35 - 90 - wobble(index, 24),
                    duration: rise,
                    ease: 'power2.out',
                },
                at
            )
            .to(
                letter.el,
                { y: () => target(index).y, duration: flight - rise, ease: 'power2.in' },
                at + rise
            )
            .to(
                letter.el,
                {
                    rotation: 200 + wobble(index, 90),
                    skewX: wobble(index + 7, 5),
                    duration: flight,
                    ease: 'none',
                },
                at
            )

            // Losing starch: the stroke thins, the terminals round and the
            // alternates destabilise over the first third of the flight.
            .to(
                letter.el,
                {
                    '--letter-wght': 460,
                    '--letter-soft': 100,
                    '--letter-wonk': 1,
                    duration: flight * 0.3,
                    ease: 'none',
                },
                at
            )

            // Past about ninety degrees nobody is reading it as a letter, so it
            // becomes the cloth it always was.
            .to(letter.ink, { opacity: 0, duration: 0.16, ease: 'none' }, at + rise)
            .to(letter.scrap, { opacity: 1, duration: 0.16, ease: 'none' }, at + rise)
            .to(
                letter.el,
                { scale: 0.34, opacity: 0, duration: flight * 0.3, ease: 'power2.in' },
                at + flight * 0.7
            );

        letter.el.style.setProperty('--letter-scrap', `var(${SCRAPS[index % SCRAPS.length]})`);
    });

    const cleanWords = root.querySelectorAll<HTMLElement>('[data-wash="clean-word"]');
    const clean = root.querySelector<HTMLElement>('[data-wash="clean"]');

    // Typed to the parts list, so a hook that no longer exists is a compile
    // error rather than a silent no-op at runtime.
    const part = (name: (typeof WASH_PARTS)[number]) =>
        root.querySelector<SVGElement>(`[data-wash="${name}"]`);

    timeline
        .fromTo(
            part('door'),
            { scaleX: 1, svgOrigin: PIVOT.door },
            {
                scaleX: 0.12,
                svgOrigin: PIVOT.door,
                duration: SCORE.doorOpen.duration,
                ease: 'power2.inOut',
            },
            SCORE.doorOpen.at
        )
        .to(
            part('door'),
            {
                scaleX: 1,
                svgOrigin: PIVOT.door,
                duration: SCORE.doorShut.duration,
                ease: 'power2.inOut',
            },
            SCORE.doorShut.at
        )

        // The pour is two stages: the cup goes into the drawer, and only after a
        // travel delay does anything appear in the glass.
        .to(part('cup'), { opacity: 1, duration: 0.2 }, SCORE.cup.at)
        .to(
            part('cup'),
            {
                rotation: 62,
                svgOrigin: PIVOT.cup,
                duration: SCORE.cup.duration,
                ease: 'power2.in',
            },
            SCORE.cup.tip
        )
        .to(part('cup'), { opacity: 0, duration: 0.25 }, SCORE.cup.tip + SCORE.cup.duration)
        .to(part('drawer-tint'), { opacity: 0.85, duration: 0.25 }, SCORE.drawer.at)
        .to(part('drawer-tint'), { opacity: 0, duration: 0.4 }, SCORE.drawer.at + 0.5)

        // Enters through the top edge of the glass and sinks. The offsets are in
        // the machine's own coordinates rather than percentages of a measured
        // box, so what shows up on screen does not depend on a bounding box read
        // at the wrong moment.
        .fromTo(
            part('ribbon-pink'),
            { y: -168, opacity: 0 },
            {
                y: 44,
                opacity: 1,
                duration: SCORE.ribbonPink.duration,
                ease: 'power1.in',
            },
            SCORE.ribbonPink.at
        )
        // Into the water and gone. The streak used to thin to a little over
        // half and stop there, which left two coloured stripes hanging in the
        // drum for the rest of the section, through the spin and out the other
        // side: detergent that is poured in and never dissolves. Eased in, so
        // it holds its colour as it meets the water and then disperses rather
        // than dimming evenly from the moment it lands.
        //
        // It also used to overlap the fall it belongs to, two tweens writing
        // opacity in the same frames and the later one winning by insertion
        // order. This starts where the fall ends.
        .to(
            part('ribbon-pink'),
            { opacity: 0, duration: SCORE.ribbonPink.fade, ease: 'power2.in' },
            SCORE.ribbonPink.at + SCORE.ribbonPink.duration
        )
        .fromTo(
            part('ribbon-blue'),
            { y: -172, opacity: 0 },
            {
                y: 52,
                opacity: 1,
                duration: SCORE.ribbonBlue.duration,
                ease: 'power1.in',
            },
            SCORE.ribbonBlue.at
        )
        .to(
            part('ribbon-blue'),
            { opacity: 0, duration: SCORE.ribbonBlue.fade, ease: 'power2.in' },
            SCORE.ribbonBlue.at + SCORE.ribbonBlue.duration
        )

        .to(
            part('water'),
            { y: SCORE.water.rise, duration: SCORE.water.duration, ease: 'power1.inOut' },
            SCORE.water.at
        )
        .to(part('foam'), { opacity: 1, duration: SCORE.foam.duration }, SCORE.foam.at)

        // The clean line arrives while the water is still rising, so the column
        // is never empty on the way through.
        .to(clean, { opacity: 1, duration: 0.01 }, SCORE.clean.at - 0.01)
        .fromTo(
            cleanWords,
            { opacity: 0, y: 14 },
            {
                opacity: 1,
                y: 0,
                duration: SCORE.clean.duration,
                stagger: SCORE.clean.stagger,
                ease: 'power2.out',
            },
            SCORE.clean.at
        )

        .to(
            part('drum-bubbles'),
            {
                rotation: 540,
                svgOrigin: PIVOT.drum,
                duration: SCORE.spin.duration,
                ease: 'power1.in',
            },
            SCORE.spin.at
        )
        .to(part('swirls'), { opacity: 1, duration: 0.3 }, SCORE.spin.at)
        .to(
            part('swirls'),
            {
                rotation: 420,
                svgOrigin: PIVOT.drum,
                duration: SCORE.spin.duration,
                ease: 'power1.in',
            },
            SCORE.spin.at
        )
        // Foam smears into the rotation rather than blurring: no filter runs
        // while anything is moving.
        .to(
            part('foam'),
            { scaleY: 0.4, skewX: -18, opacity: 0.5, duration: SCORE.spin.duration * 0.5 },
            SCORE.spin.at
        )
        // A beat of stillness at full spin before the section lets go.
        .to({}, { duration: SCORE.total - (SCORE.spin.at + SCORE.spin.duration) }, SCORE.total);

    return {
        timeline,
        invalidate: () => {
            measured = null;
        },
    };
};
