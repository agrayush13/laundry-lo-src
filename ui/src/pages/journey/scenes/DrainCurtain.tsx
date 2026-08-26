import React from 'react';
import styles from './drainCurtain.module.scss';

/**
 * The hero ends with a full drum, and this is where that water drains down the
 * page. Two overlapping layers with a hand-drawn lower edge, not a sine wave:
 * the whole point is that it looks poured rather than plotted.
 *
 * It sweeps down, retreats, and leaves a hairline behind. What it must never do
 * is sit there as a band across the top, which would be exactly the hard colour
 * break between sections the design forbids.
 */
const DrainCurtain: React.FC = () => (
    <svg
        className={styles.curtain}
        viewBox="0 0 1200 260"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
    >
        {/* Parked above the seam in the SVG's own units until the entry pulls
            it down. Percentages would depend on a measured box; these do not. */}
        <g
            data-rinse="curtain"
            transform="translate(0 -210)"
        >
            <path
                className={styles.curtainBack}
                d="M0 0 H1200 V168 C1092 186 1010 150 902 162 C806 173 742 196 640 190 C548 185 470 158 372 166 C268 175 190 200 96 188 C58 183 26 174 0 180 Z"
            />
            <path
                className={styles.curtainFront}
                d="M0 0 H1200 V142 C1108 132 1038 164 940 158 C844 152 780 124 686 132 C596 140 520 172 428 164 C336 156 268 126 172 134 C110 139 54 158 0 152 Z"
            />
        </g>

        {/* The drips after a pour. They fall out of the retreating curtain and
            are gone; nothing here loops. */}
        <g data-rinse="droplets">
            {[
                { x: 168, r: 5 },
                { x: 392, r: 4 },
                { x: 604, r: 6 },
                { x: 812, r: 4.5 },
                { x: 1016, r: 5 },
            ].map((drop) => (
                <ellipse
                    className={styles.droplet}
                    cx={drop.x}
                    cy="150"
                    key={drop.x}
                    rx={drop.r}
                    ry={drop.r * 1.5}
                />
            ))}
        </g>

        {/* What the curtain settles into, and all that is left of it. */}
        <path
            className={styles.line}
            data-rinse="line"
            d="M0 96 C 220 92, 420 100, 640 96 C 860 92, 1020 100, 1200 96"
        />
    </svg>
);

export default DrainCurtain;
