/**
 * `laundrylo-mark.svg` as numbers: the drum-o, ink ring with water in it. Shared
 * by the corner dial and by the spin section's axis, so the water-in-a-circle
 * motif is one shape drawn at two sizes rather than two shapes that resemble
 * each other.
 */
export const DRUM_MARK = {
    viewBox: '0 0 49.1 61.2',
    centre: { x: 24.55, y: 36.65 },
    ringRadius: 22.1,
    ringWidth: 4.9,
    innerRadius: 19.6,
    /**
     * How full the drum reads before anything has been wrung into it. The spin
     * raises the water from here; the mark is drawn at this level so a drum that
     * never gets a motion layer still has water in the bottom of it.
     */
    restingWater: 0.18,
    /** The dot above the drum, as in the wordmark. */
    dot: { cx: 42.15, cy: 5.25, r: 3.9, width: 2.7 },
    width: 49.1,
    /** The box the viewBox describes, which the drum is not centred in: the dot
     *  above it takes the top of the box, so the drum's own centre sits low. */
    height: 61.2,
} as const;
