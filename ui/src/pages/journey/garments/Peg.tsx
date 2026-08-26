import React from 'react';
import styles from './garments.module.scss';

/**
 * A wooden peg, drawn from the point it grips: two halves and the spring between
 * them. Every garment hangs from one at its own local origin, which is also the
 * point the wind will swing it around.
 */
const Peg: React.FC = () => (
    <g className={styles.peg}>
        <rect
            className={styles.pegWood}
            x="-9"
            y="-15"
            width="8.5"
            height="30"
            rx="3"
        />
        <rect
            className={styles.pegWoodDark}
            x="0.5"
            y="-15"
            width="8.5"
            height="30"
            rx="3"
        />
        <rect
            className={styles.pegSpring}
            x="-9"
            y="-5"
            width="18"
            height="3"
            rx="1.5"
        />
    </g>
);

export default Peg;
