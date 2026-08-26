import React from 'react';
import { SOCK } from './garmentPaths';
import styles from './glyphs.module.scss';

/**
 * The "l" of "laundry". An l is a bare vertical stem, which is exactly a sock
 * hanging by its cuff: ribbed cuff at the ascender, straight leg down the stem,
 * and the foot turning right at the baseline as the letter's terminal tail. The
 * foot sits on the baseline, never below it. It returns clean on the line, drawn
 * from the same geometry.
 */
const SockGlyph: React.FC = () => (
    <svg
        className={`${styles.glyph} ${styles.sock}`}
        viewBox={`0 0 ${SOCK.width} ${SOCK.height}`}
        aria-hidden="true"
        focusable="false"
    >
        <rect {...SOCK.leg} />
        <path d={SOCK.foot} />
        <rect {...SOCK.cuff} />
        {SOCK.ribs.map((rib) => (
            <rect
                className={styles.cut}
                key={rib.y}
                {...rib}
            />
        ))}
        <ellipse
            className={styles.stain}
            {...SOCK.stain}
        />
    </svg>
);

export default SockGlyph;
