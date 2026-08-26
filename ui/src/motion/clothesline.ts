import { Rope } from './rope';

/**
 * The garments on the line: where each one is pegged, how it swings, and how it
 * arrives.
 *
 * A garment is a pendulum hanging off a rope point. It is driven by the sideways
 * acceleration of the peg it hangs from, so a breeze that moves the rope moves
 * the cloth, and a garment landing further down the line reaches its neighbours
 * through the rope rather than through any code that knows they are neighbours.
 */

/** A breeze, not a storm. */
const MAX_ANGLE = 17;
const STIFFNESS = 22;
const DAMPING = 3.1;
/** The fastest a garment may swing, which keeps the cloth on the rope. */
const MAX_SPEED = 62;
/**
 * How far the breeze carries a garment.
 *
 * This is the whole of the motion now. It used to be an idle sway kept
 * deliberately narrow so that a gust pushed from the pointer would read as the
 * visitor's own; there is no pointer wind any more, so the breeze is no longer
 * competing with anything and can be as wide as washing on a line actually
 * moves. Still well inside the angle cap, because cloth that swings to its
 * limit is cloth in a gale.
 */
const BREEZE = 9.5;
/** Printed garments turn with the breeze; the unprinted ones are free to flap. */
const PRINTED_DRIVE = 0.55;
const PLAIN_DRIVE = 1;

/** How hard the breeze leans on the line, in scene units a second, and how much of it it covers. */
const BREEZE_FORCE = 96;
const BREEZE_SPREAD = 520;

export interface Garment {
    el: SVGGElement;
    /** Where it hangs at rest, in the scene's coordinates. */
    home: { x: number; y: number };
    /**
     * Where its rope point started. A garment follows how far its point has
     * moved rather than sitting on the point itself: the points are samples
     * taken along the line and the nearest one can be twenty pixels off, which
     * would drag the garment away from the spot the scene was composed at.
     */
    rest: { x: number; y: number };
    index: number;
    printed: boolean;
    angle: number;
    velocity: number;
    /** How far into the assembly this one lands. */
    landsAt: number;
}

export const readGarments = (scene: SVGSVGElement, rope: Rope, selector: string): Garment[] => {
    const nodes = Array.from(scene.querySelectorAll<SVGGElement>(selector));

    return nodes.map((el, order) => {
        const [x, y] = (el.dataset.pivot ?? '0 0').split(' ').map(Number);
        const index = rope.indexAt(x);
        const point = rope.attachment(index);
        rope.points[index].load = 0.55;

        return {
            el,
            home: { x, y },
            rest: point,
            index,
            printed: Boolean(el.querySelector('[class*="print"]')),
            angle: 0,
            velocity: 0,
            // Divided by the gaps between garments rather than by the count,
            // so the last one lands exactly on the end of the schedule instead
            // of one gap short of it. The schedule stops at just over half the
            // hold: what the section is for is the line hanging complete, and a
            // final garment still arriving at seven tenths of the way through
            // means most of the time spent here is spent watching an unfinished
            // composition.
            landsAt: 0.1 + (order / Math.max(1, nodes.length - 1)) * 0.45,
        };
    });
};

/**
 * The breeze itself: a soft push that wanders along the line.
 *
 * Applied to the rope rather than to the garments, so what the eye sees is one
 * body of air moving over the whole line. The push travels, which is what makes
 * a wave run along the catenary and the garments answer their neighbours a beat
 * late; a push parked in the middle would pump the rope like a skipping rope
 * instead. Two rates that do not divide into each other, so nothing repeats on
 * a period anybody can count.
 *
 * Scaled by the frame, because this runs every frame: `gust` displaces the rope
 * by a fixed amount per call, which is right for a shove and wrong for weather.
 * Unscaled, a laptop at 120fps gets twice the wind of the same page at 60.
 */
export const breeze = (rope: Rope, time: number, seconds: number, span: number) => {
    const strength = Math.sin(time * 0.62) * 0.7 + Math.sin(time * 0.29 + 1.4) * 0.3;
    const at = span * (0.5 + 0.34 * Math.sin(time * 0.21));

    rope.gust(at, strength * BREEZE_FORCE * seconds, BREEZE_SPREAD);
};

/** Ambient sway, and whatever the breeze is doing to the rope underneath it. */
export const swing = (garment: Garment, rope: Rope, seconds: number, time: number) => {
    const point = rope.points[garment.index];
    const drive = (point.x - point.px) * (garment.printed ? PRINTED_DRIVE : PLAIN_DRIVE);

    // Every garment gets its own slow breath at its own rate, so neighbours are
    // never in step and the line never reads as one looping animation.
    const breath =
        Math.sin(time * (0.5 + garment.index * 0.07) + garment.index) *
        BREEZE *
        (garment.printed ? 0.7 : 1);

    const acceleration =
        -STIFFNESS * (garment.angle - breath) - DAMPING * garment.velocity + drive * 52;

    garment.velocity += acceleration * seconds;
    garment.velocity = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, garment.velocity));
    garment.angle += garment.velocity * seconds;

    if (Math.abs(garment.angle) > MAX_ANGLE) {
        garment.angle = Math.sign(garment.angle) * MAX_ANGLE;
        garment.velocity *= -0.3;
    }
};

/**
 * Where a garment is while the line is still being assembled. Before it lands it
 * is offscreen to the left, arcing in with a slight rotation; after it lands the
 * rope has it.
 */
export const arrival = (garment: Garment, rope: Rope, progress: number) => {
    const point = rope.attachment(garment.index);
    const landed = progress >= garment.landsAt;

    if (landed) {
        // Its own place, displaced by however far the line under it has moved.
        return {
            x: garment.home.x + (point.x - garment.rest.x),
            y: garment.home.y + (point.y - garment.rest.y),
            angle: garment.angle,
            opacity: 1,
        };
    }

    const flight = Math.max(0, (progress - (garment.landsAt - 0.16)) / 0.16);
    if (flight <= 0) {
        return { x: -260, y: garment.home.y, angle: -26, opacity: 0 };
    }

    // Flies to the place it was drawn, not to the sample nearest it.
    return {
        x: -260 + (garment.home.x + 260) * flight,
        y: garment.home.y - Math.sin(flight * Math.PI) * 120,
        angle: -26 * (1 - flight),
        opacity: 1,
    };
};

/** The dip a garment puts into the line at the moment it is pegged on. */
export const land = (rope: Rope, garment: Garment) => {
    const point = rope.points[garment.index];
    if (!point.pinned) {
        point.y += 16;
    }

    // The peg snap, felt as a kick rather than seen as a keyframe.
    garment.velocity += 26;
};
