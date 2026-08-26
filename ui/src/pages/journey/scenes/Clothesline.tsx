import React from 'react';
import { DRY } from '../../../config/cycleConfig';
import HandkerchiefGarment from '../garments/HandkerchiefGarment';
import KurtaGarment from '../garments/KurtaGarment';
import ShirtGarment from '../garments/ShirtGarment';
import SockGarment from '../garments/SockGarment';
import TeeGarment from '../garments/TeeGarment';
import TowelGarment from '../garments/TowelGarment';
import styles from './clothesline.module.scss';

/**
 * A rope with a natural sag, anchored at both edges. The pegs below sit on this
 * curve: their coordinates are points sampled from it, so the line reads as one
 * continuous thing rather than as garments floating near a stroke.
 */
const ROPE = 'M40 152 C 320 300, 880 300, 1160 152';
const ANCHORS = [
    { x: 40, y: 152 },
    { x: 1160, y: 152 },
];

const [book, collect, clean, back] = DRY.steps;

/** Left to right, with the dressing interleaved between the steps. */
const HANGING = [
    { id: 'tee', x: 141.8, y: 195.5, garment: <TeeGarment step={book} /> },
    { id: 'sock', x: 288, y: 234.1, garment: <SockGarment /> },
    { id: 'shirt', x: 456, y: 257.1, garment: <ShirtGarment step={collect} /> },
    { id: 'kurta', x: 637.8, y: 262.6, garment: <KurtaGarment step={clean} /> },
    { id: 'hanky', x: 817.5, y: 249.4, garment: <HandkerchiefGarment /> },
    { id: 'towel', x: 1011.7, y: 210.2, garment: <TowelGarment step={back} /> },
];

/**
 * The dry, as one scene. Empty paper sky by design: no sun, no clouds, no
 * horizon. What makes it feel like weather is the sag, the shadows and, once the
 * wind lands, the motion.
 *
 * The scene is hidden from assistive technology because the steps printed on the
 * garments are also a real list in the markup, and hearing each of them twice
 * would be worse than not seeing the drawing at all.
 */
const Clothesline: React.FC = () => (
    <svg
        className={styles.scene}
        data-dry="scene"
        viewBox="0 0 1200 560"
        aria-hidden="true"
        focusable="false"
    >
        {ANCHORS.map((anchor) => (
            <g key={anchor.x}>
                <circle
                    className={styles.anchor}
                    cx={anchor.x}
                    cy={anchor.y}
                    r="7"
                />
                <path
                    className={styles.anchorHook}
                    d={`M${anchor.x} ${anchor.y} v-16`}
                />
            </g>
        ))}

        {/* Two strands: the second is dashed and offset a hair, which is enough
            to hint at the twist without drawing rope fibre. */}
        <path
            className={styles.rope}
            data-dry="rope"
            d={ROPE}
        />
        <path
            className={styles.ropeTwist}
            data-dry="rope"
            d={ROPE}
        />

        {HANGING.map(({ id, x, y, garment }) => (
            <g
                className={styles.hanging}
                data-dry="garment"
                data-garment={id}
                data-pivot={`${x} ${y}`}
                key={id}
                transform={`translate(${x} ${y})`}
            >
                {garment}
            </g>
        ))}
    </svg>
);

export default Clothesline;
