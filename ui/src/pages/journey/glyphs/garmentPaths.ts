/**
 * The hero's two garment letters, as geometry rather than as components.
 *
 * The sock is drawn from here twice: as the l of "laundry", and again on the
 * clothesline once it is clean. The design asks for those to be the same object,
 * so editing the cuff changes the letter and the laundry together, which is the
 * only way that promise survives a redesign.
 *
 * The tee is the hero's alone. On the line it is redrawn with a wider body,
 * because a t's stem is narrower than the words printed across its chest and a
 * print that overruns the silhouette is a defect.
 *
 * Coordinates are in a 100-unit box whose bottom edge is the baseline.
 */

export const TEE = {
    width: 54,
    height: 100,
    /** Sleeves double as the crossbar of the letter t. */
    sleeveLeft: 'M15 30 L2 35 V47 H15 Z',
    sleeveRight: 'M39 30 L52 35 V47 H39 Z',
    /** Body is the stem, with a collar notch at the shoulders. */
    body: 'M15 27 C15 24 17 22 20 22 H23 C24 28 25 30 27 30 C29 30 30 28 31 22 H34 C37 22 39 24 39 27 V100 H15 Z',
    shoulder: { x: 27, y: 22 },
    stain: { cx: 27, cy: 64, rx: 6, ry: 4.5 },
} as const;

export const SOCK = {
    width: 52,
    height: 100,
    leg: { x: 9, y: 13, width: 20, height: 74 },
    /** The foot turns right on the baseline, as the letter l's tail. */
    foot: 'M9 78 H34 C43 78 48 84 48 90.5 C48 96 44 100 38 100 H9 Z',
    cuff: { x: 6, y: 0, width: 26, height: 17, rx: 3 },
    ribs: [
        { x: 8, y: 4.5, width: 22, height: 2.5 },
        { x: 8, y: 9.5, width: 22, height: 2.5 },
    ],
    stain: { cx: 18, cy: 90, rx: 5, ry: 3.5 },
} as const;
