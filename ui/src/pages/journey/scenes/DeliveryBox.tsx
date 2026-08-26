import React, { useId } from 'react';
import { WORDMARK } from '../../../common-ui/logo/wordmark';
import { SOCK } from '../glyphs/garmentPaths';
import styles from './deliveryBox.module.scss';

/**
 * The carton, drawn in three layers so the washing is inside it rather than
 * stacked in front of it: back wall and rear flaps behind, the folded stack in
 * the middle, and the front panel and side walls in front, cutting across the
 * bottom of the lowest garment.
 *
 * Everything here is flat tone. The interior reads as a container because the
 * inner walls step darker, not because anything is shaded.
 */

/**
 * The lockup printed on the carton, placed by its own ink rather than by its
 * viewBox: the wordmark's box carries space above the ascenders and below the
 * descenders that the panel should not have to pay for.
 *
 * It is the real logo, drawn from the same outlines the header uses, not a drum
 * redrawn at carton size. There was one of those here and it was wrong twice
 * over: its water was never clipped to the ring, so the puddle escaped at the
 * bottom and the mark read as a broken circle, and it had no dot, which is half
 * of what makes the mark the mark.
 */
const INK = { x: 2.9, y: -74.2, width: 451.85, height: 97.7 };
/** The middle of the carton's front panel, and how much of it the logo takes. */
const PANEL = { x: 300, y: 343, width: 190 };
const PRINT_SCALE = PANEL.width / INK.width;
const PRINT = [
    `translate(${PANEL.x} ${PANEL.y})`,
    `scale(${PRINT_SCALE.toFixed(4)})`,
    `translate(${-(INK.x + INK.width / 2)} ${-(INK.y + INK.height / 2)})`,
].join(' ');

/** Five layers, unevenly offset, because a hand folded them. */
const STACK = [
    { y: 276, tone: 'tan', inset: 4 },
    { y: 256, tone: 'mint', inset: 2 },
    { y: 237, tone: 'pink', inset: 5 },
    { y: 219, tone: 'blue', inset: 1 },
    { y: 199, tone: 'ink', inset: 3 },
];

const SOCK_SCALE = 0.46;

const DeliveryBox: React.FC = () => {
    const brandClip = useId();

    return (
        <svg
            className={styles.box}
            data-deliver="box"
            viewBox="0 0 600 470"
            aria-hidden="true"
            focusable="false"
        >
            <ellipse
                className={styles.shadow}
                cx="300"
                cy="432"
                rx="176"
                ry="16"
            />

            {/* Two rear flaps, folded outward at a shallow angle. Separate planes
            with their own thickness, never one continuous chevron. */}
            <g data-deliver="flaps">
                <path
                    className={styles.flap}
                    d="M146 178 H292 L280 122 C280 117 276 114 271 115 L124 130 C119 131 116 135 117 140 Z"
                />
                <path
                    className={styles.flapEdge}
                    d="M146 178 H292 L290 168 H148 Z"
                />
                <path
                    className={styles.flap}
                    d="M308 178 H454 L476 140 C477 135 474 131 469 130 L322 115 C317 114 313 117 313 122 Z"
                />
                <path
                    className={styles.flapEdge}
                    d="M308 178 H454 L456 168 H310 Z"
                />
            </g>

            {/* Interior: back wall, then side walls one step darker again. */}
            <path
                className={styles.interiorBack}
                d="M146 178 H454 V300 H146 Z"
            />
            <path
                className={styles.interiorSide}
                d="M146 178 L176 200 V300 H146 Z"
            />
            <path
                className={styles.interiorSide}
                d="M454 178 L424 200 V300 H454 Z"
            />

            {/* The wash, folded and put away. */}
            <g data-deliver="stack">
                {STACK.map((layer) => (
                    <g
                        className={styles.layer}
                        data-deliver="layer"
                        key={layer.y}
                    >
                        <rect
                            className={styles[layer.tone as keyof typeof styles]}
                            x={168 + layer.inset}
                            y={layer.y}
                            width={264 - layer.inset * 2}
                            height="19"
                            rx="4"
                        />
                        {layer.tone === 'ink' ? (
                            <>
                                {/* The tee that started as a letter: collar notch and
                                a sleeve seam, so it is a garment and not a bar. */}
                                <path
                                    className={styles.collar}
                                    d={`M288 ${layer.y} h24 v5 a12 12 0 0 1 -24 0 Z`}
                                />
                                <path
                                    className={styles.seamLight}
                                    d={`M196 ${layer.y + 5} v9`}
                                />
                            </>
                        ) : (
                            <path
                                className={styles.seam}
                                d={`M${176 + layer.inset} ${layer.y + 11} H${424 - layer.inset}`}
                            />
                        )}
                    </g>
                ))}
            </g>

            {/* Front panel and sides, in front of the stack. The lowest garment is
            cut off about a fifth of the way up, which is what puts the washing
            inside the box. */}
            <path
                className={styles.side}
                d="M146 290 L118 312 V404 L146 386 Z"
            />
            <path
                className={styles.side}
                d="M454 290 L482 312 V404 L454 386 Z"
            />
            <path
                className={styles.front}
                d="M146 290 H454 V386 C454 392 449 396 443 396 H157 C151 396 146 392 146 386 Z"
            />

            {/* Printed on the front panel. */}
            <g
                className={styles.brand}
                transform={PRINT}
            >
                {WORDMARK.letters.map((d) => (
                    <path
                        d={d}
                        key={d.slice(0, 24)}
                    />
                ))}

                <circle
                    cx={WORDMARK.drum.cx}
                    cy={WORDMARK.drum.cy}
                    fill="none"
                    r={WORDMARK.drum.r}
                    strokeWidth={WORDMARK.drum.stroke}
                />
                <clipPath id={brandClip}>
                    <circle
                        cx={WORDMARK.drum.cx}
                        cy={WORDMARK.drum.cy}
                        r={WORDMARK.drum.inner}
                    />
                </clipPath>
                <g clipPath={`url(#${brandClip})`}>
                    <path
                        className={styles.brandWater}
                        d={WORDMARK.water}
                    />
                </g>
                <circle
                    className={styles.brandDot}
                    cx={WORDMARK.dot.cx}
                    cy={WORDMARK.dot.cy}
                    fill="none"
                    r={WORDMARK.dot.r}
                    strokeWidth={WORDMARK.dot.stroke}
                />
            </g>

            {/* The sock that was a letter, then hung on the line, now tucked into the
            near corner with its cuff above the panel. */}
            <g
                className={styles.sock}
                transform={`translate(150 250) rotate(-14) scale(${SOCK_SCALE})`}
            >
                <rect {...SOCK.leg} />
                <path d={SOCK.foot} />
                <rect {...SOCK.cuff} />
            </g>

            {/* Peg, string and tag are one assembly: the peg grips the near flap and
            the string runs from it to where the tag hangs. */}
            <g data-deliver="tag-line">
                <path
                    className={styles.string}
                    d="M462 150 C 486 178, 498 200, 502 226"
                />
                <g className={styles.peg}>
                    <rect
                        x="454"
                        y="136"
                        width="7"
                        height="22"
                        rx="3"
                        transform="rotate(-6 457 147)"
                    />
                    <rect
                        className={styles.pegDark}
                        x="462"
                        y="135"
                        width="7"
                        height="22"
                        rx="3"
                        transform="rotate(-6 465 146)"
                    />
                </g>
            </g>
        </svg>
    );
};

export default DeliveryBox;
