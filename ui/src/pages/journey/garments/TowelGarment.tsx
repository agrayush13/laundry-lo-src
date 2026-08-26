import React from 'react';
import { CycleStep } from '../../../config/cycleConfig';
import GarmentPrint from './GarmentPrint';
import Peg from './Peg';
import styles from './garments.module.scss';

/** A folded-over towel in tan, with its woven bands, carrying the last step. */
const TowelGarment: React.FC<{ step: CycleStep }> = ({ step }) => (
    <>
        <g className={styles.shadow}>
            <path
                d="M-66 12 C-66 8 -63 6 -59 6 H59 C63 6 66 8 66 12 V190 C66 194 63 196 59 196 H-59 C-63 196 -66 194 -66 190 Z"
                key="M-66 12 C-66 8"
            />
        </g>
        <path
            className={styles.tan}
            d="M-66 12 C-66 8 -63 6 -59 6 H59 C63 6 66 8 66 12 V190 C66 194 63 196 59 196 H-59 C-63 196 -66 194 -66 190 Z"
        />

        {/* The bands a towel is woven with, and the fold it hangs over. */}
        <path
            className={styles.seam}
            d="M-66 96 H66"
        />
        <path
            className={styles.seam}
            d="M-66 108 H66"
        />
        <path
            className={styles.seam}
            d="M-66 168 H66"
        />
        <path
            className={styles.seam}
            d="M-66 178 H66"
        />

        <GarmentPrint
            step={step}
            y={52}
        />
        <Peg />
    </>
);

export default TowelGarment;
