import React from 'react';
import { SOCK } from '../glyphs/garmentPaths';
import Peg from './Peg';
import styles from './garments.module.scss';

// Hangs by its cuff, at the size the line asks for.
const SCALE = 1.55;
const OFFSET = { x: -((SOCK.cuff.x + SOCK.cuff.width / 2) * SCALE), y: 4 };

/**
 * The same sock that was the l of "laundry", drawn from the same geometry and
 * missing only its stain. Dressing, not a step: it carries no print.
 */
const SockGarment: React.FC = () => (
    <>
        <g
            className={styles.shadow}
            transform={`translate(${OFFSET.x} ${OFFSET.y}) scale(${SCALE})`}
        >
            <rect {...SOCK.leg} />
            <path d={SOCK.foot} />
            <rect {...SOCK.cuff} />
        </g>
        <g transform={`translate(${OFFSET.x} ${OFFSET.y}) scale(${SCALE})`}>
            <rect
                className={styles.ink}
                {...SOCK.leg}
            />
            <path
                className={styles.ink}
                d={SOCK.foot}
            />
            <rect
                className={styles.ink}
                {...SOCK.cuff}
            />
            {SOCK.ribs.map((rib) => (
                <rect
                    className={styles.notch}
                    key={rib.y}
                    {...rib}
                />
            ))}
        </g>
        <Peg />
    </>
);

export default SockGarment;
