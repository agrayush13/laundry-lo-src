import React from 'react';
import { CycleStep } from '../../../config/cycleConfig';
import styles from './garments.module.scss';

interface GarmentPrintProps {
    step: CycleStep;
    /** Chest centre, in the scene's coordinates. */
    y: number;
    /** Ink garments take the light print; everything else takes the dark one. */
    onInk?: boolean;
}

/**
 * Screen-printed on the garment, not tagged to it. Both lines are sized and
 * placed to sit inside the silhouette at full sway, and both meet 4.5:1 against
 * the cloth they are printed on, which is why the light and dark prints are two
 * different pairs of colours rather than one pair used twice.
 */
const GarmentPrint: React.FC<GarmentPrintProps> = ({ step, y, onInk }) => (
    <g
        className={onInk ? styles.printOnInk : styles.print}
        aria-hidden="true"
    >
        <text
            className={styles.printNumber}
            x="0"
            y={y}
            textAnchor="middle"
        >
            {step.number}
        </text>
        <text
            className={styles.printLabel}
            x="0"
            y={y + 19}
            textAnchor="middle"
        >
            {step.label}
        </text>
    </g>
);

export default GarmentPrint;
