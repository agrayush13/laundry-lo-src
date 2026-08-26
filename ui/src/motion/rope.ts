/**
 * A verlet rope: a chain of points that fall under gravity and are pulled back
 * into line by their neighbours. It is about eighty per cent of a cloth
 * simulation for a fraction of the cost, and it is the reason a garment landing
 * on the line makes the line dip, the neighbours nod, and the sag settle deeper
 * than it was.
 *
 * Everything here is plain arithmetic on a couple of arrays. No dependency, no
 * allocation per frame, and it runs on twenty-four points, which is fewer than
 * one frame of layout would cost.
 */

export interface RopePoint {
    x: number;
    y: number;
    /** Where it was last step; the difference is its velocity. */
    px: number;
    py: number;
    pinned: boolean;
    /** Garments hang weight on the points they are pegged to. */
    load: number;
}

const GRAVITY = 1400;
/**
 * Segments rest slightly shorter than they were drawn.
 *
 * The curve in the scene is a drawn shape, not a physical catenary, so a rope
 * whose segments rest at exactly that length settles about seventy units below
 * it once gravity has its say, and the whole line drops off the composition.
 * Taking five per cent out puts the resting shape back on the drawing and
 * leaves the sag to come from what is hung on it. Calibrated against the
 * solver, not guessed.
 */
const TENSION = 0.95;
const DAMPING = 0.985;
const ITERATIONS = 4;

export class Rope {
    readonly points: RopePoint[] = [];
    /**
     * One rest length per segment, not one for the whole rope.
     *
     * The points are sampled at even steps along a curve, which does not make
     * them evenly spaced: the segments run 42 units near the anchors and 55 in
     * the middle. Taking a single length from the first pair makes the rope
     * about fifteen per cent shorter than the gap it has to span, so the
     * solver pulls it taut and drags every point along the line towards a
     * straight one, taking the garments pegged to them with it.
     *
     * Per-segment lengths mean the rope's rest shape is the shape it was drawn
     * at, and load is what makes it sag from there.
     */
    private readonly restLengths: number[] = [];

    constructor(
        sample: (t: number) => { x: number; y: number },
        readonly count = 24
    ) {
        for (let index = 0; index < count; index += 1) {
            const { x, y } = sample(index / (count - 1));
            this.points.push({
                x,
                y,
                px: x,
                py: y,
                pinned: index === 0 || index === count - 1,
                load: 0,
            });
        }

        for (let index = 0; index < count - 1; index += 1) {
            const a = this.points[index];
            const b = this.points[index + 1];
            this.restLengths.push(Math.hypot(b.x - a.x, b.y - a.y) * TENSION);
        }
    }

    /** Nearest point to an x position, which is where a garment gets pegged. */
    indexAt(x: number) {
        let best = 0;
        this.points.forEach((point, index) => {
            if (Math.abs(point.x - x) < Math.abs(this.points[best].x - x)) {
                best = index;
            }
        });
        return best;
    }

    /** A sideways shove, strongest at the point nearest the gust. */
    gust(x: number, force: number, spread = 220) {
        this.points.forEach((point) => {
            if (point.pinned) {
                return;
            }
            const falloff = Math.max(0, 1 - Math.abs(point.x - x) / spread);
            point.x += force * falloff * falloff;
        });
    }

    step(seconds: number) {
        const drag = Math.pow(DAMPING, seconds * 60);

        this.points.forEach((point) => {
            if (point.pinned) {
                return;
            }

            const vx = (point.x - point.px) * drag;
            const vy = (point.y - point.py) * drag;

            point.px = point.x;
            point.py = point.y;
            point.x += vx;
            point.y += vy + GRAVITY * (1 + point.load) * seconds * seconds;
        });

        for (let pass = 0; pass < ITERATIONS; pass += 1) {
            this.constrain();
        }
    }

    private constrain() {
        for (let index = 0; index < this.points.length - 1; index += 1) {
            const a = this.points[index];
            const b = this.points[index + 1];

            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const distance = Math.hypot(dx, dy) || 0.0001;
            const shift = (distance - this.restLengths[index]) / distance / 2;

            const ox = dx * shift;
            const oy = dy * shift;

            if (!a.pinned) {
                a.x += ox;
                a.y += oy;
            }
            if (!b.pinned) {
                b.x -= ox;
                b.y -= oy;
            }
        }
    }

    /**
     * Where a garment pegged near a point actually hangs.
     *
     * The drawn path is a quadratic through the midpoints of each segment, using
     * the points themselves as control handles, so the visible rope does not
     * pass through its own points. At rest the gap is a few units and does not
     * show; under a gust the control point swings far wider than the curve it
     * controls, and a garment pegged to the point leaves the rope behind.
     *
     * Evaluating that quadratic at its midpoint gives the point on the line the
     * eye actually sees, which is where the cloth belongs.
     */
    attachment(index: number) {
        const point = this.points[index];
        const before = this.points[index - 1] ?? point;
        const after = this.points[index + 1] ?? point;

        return {
            x: point.x * 0.75 + (before.x + after.x) * 0.125,
            y: point.y * 0.75 + (before.y + after.y) * 0.125,
        };
    }

    /** The rope as a smooth path, drawn through the midpoints of each segment. */
    path() {
        const [first] = this.points;
        let d = `M${first.x.toFixed(1)} ${first.y.toFixed(1)}`;

        for (let index = 1; index < this.points.length - 1; index += 1) {
            const point = this.points[index];
            const next = this.points[index + 1];
            const midX = (point.x + next.x) / 2;
            const midY = (point.y + next.y) / 2;
            d += ` Q${point.x.toFixed(1)} ${point.y.toFixed(1)} ${midX.toFixed(1)} ${midY.toFixed(1)}`;
        }

        const last = this.points[this.points.length - 1];
        return `${d} L${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
    }
}
