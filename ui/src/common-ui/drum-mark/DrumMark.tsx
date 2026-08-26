import React, { useId } from 'react';
import { DRUM_MARK } from './drumGeometry';
import styles from './drumMark.module.scss';

interface DrumMarkProps {
    /** How full the drum reads, from 0 to 1. */
    level: number;
    /**
     * Adds the holes a drum wall is perforated with. A bare ring gives rotation
     * nothing to show: a circle turning about its own centre looks identical at
     * every angle, so the spin needs something inside it that does not.
     */
    perforated?: boolean;
    className?: string;
}

/** Where the drum's holes sit, as an angle in degrees and a share of the radius. */
const HOLES = [
    { angle: 24, radius: 0.62, size: 1.5 },
    { angle: 96, radius: 0.78, size: 1.1 },
    { angle: 168, radius: 0.5, size: 1.3 },
    { angle: 232, radius: 0.8, size: 1.2 },
    { angle: 308, radius: 0.66, size: 1.4 },
];

/**
 * The water's surface, as a path rather than a flat edge.
 *
 * A rectangle reads as a fill level; a wave reads as water. The body runs well
 * past the drum on every side, so the level can be translated and the whole
 * thing tipped without either ever uncovering a corner: what the eye sees is the
 * surface line, and the clip is what keeps the rest of it inside the drum.
 */
const surfaceAt = (level: number) => {
    const { centre, innerRadius } = DRUM_MARK;
    const y = centre.y + innerRadius - innerRadius * 2 * level;
    const left = centre.x - innerRadius * 2;
    const right = centre.x + innerRadius * 2;
    const floor = centre.y + innerRadius * 3;

    return [
        `M${left} ${y + 2.4}`,
        `C${centre.x - 22} ${y - 4.2}, ${centre.x - 6} ${y + 3.4}, ${centre.x + 4} ${y - 1}`,
        `C${centre.x + 16} ${y - 5.2}, ${centre.x + 30} ${y + 1.8}, ${right} ${y - 1.6}`,
        `L${right} ${floor}`,
        `L${left} ${floor}`,
        'Z',
    ].join(' ');
};

/**
 * The drum mark with water at a given level. The corner dial fills it with
 * scroll progress, the spin section stands it on the centrifuge's axis, and the
 * loader sloshes it while a route arrives.
 */
const DrumMark: React.FC<DrumMarkProps> = ({ level, perforated, className }) => {
    const clipId = useId();
    const { centre, innerRadius } = DRUM_MARK;

    return (
        <svg
            className={[styles.mark, className].filter(Boolean).join(' ')}
            viewBox={DRUM_MARK.viewBox}
            aria-hidden="true"
            focusable="false"
        >
            <clipPath id={clipId}>
                <circle
                    cx={centre.x}
                    cy={centre.y}
                    r={innerRadius}
                />
            </clipPath>
            <g clipPath={`url(#${clipId})`}>
                {/* The drum's own wall, so the mark reads as a drum on any
                    background rather than as a ring with water in it. */}
                <circle
                    className={styles.markWall}
                    cx={centre.x}
                    cy={centre.y}
                    r={innerRadius}
                />

                {perforated && (
                    // Behind the water, so a hole that comes round under the
                    // surface goes under it rather than floating on it.
                    <g
                        className={styles.markHoles}
                        data-spin="drum-holes"
                    >
                        {HOLES.map(({ angle, radius, size }) => (
                            <circle
                                cx={
                                    centre.x +
                                    Math.cos((angle * Math.PI) / 180) * innerRadius * radius
                                }
                                cy={
                                    centre.y +
                                    Math.sin((angle * Math.PI) / 180) * innerRadius * radius
                                }
                                key={angle}
                                r={size}
                            />
                        ))}
                    </g>
                )}

                <path
                    className={styles.markWater}
                    d={surfaceAt(level)}
                    data-spin="drum-water"
                />
            </g>
            <circle
                className={styles.markRing}
                cx={centre.x}
                cy={centre.y}
                r={DRUM_MARK.ringRadius}
                fill="none"
                strokeWidth={DRUM_MARK.ringWidth}
            />
        </svg>
    );
};

export default DrumMark;
