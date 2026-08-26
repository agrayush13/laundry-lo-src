import React from 'react';
import Peg from './Peg';
import styles from './garments.module.scss';

/**
 * Pegged by one corner, so it hangs as a diamond. The lower two edges drape
 * inward rather than running straight to the point, which is the difference
 * between a square of cloth and a kite.
 */
const HandkerchiefGarment: React.FC = () => (
    <>
        <g className={styles.shadow}>
            <path
                d="M0 2 L58 58 Q30 78 0 98 Q-30 78 -58 58 Z"
                key="M0 2 L58 58 Q3"
            />
        </g>
        <path
            className={styles.blue}
            d="M0 2 L58 58 Q30 78 0 98 Q-30 78 -58 58 Z"
        />
        <path
            className={styles.seam}
            d="M-44 58 Q-22 72 0 86 Q22 72 44 58"
        />
        <Peg />
    </>
);

export default HandkerchiefGarment;
