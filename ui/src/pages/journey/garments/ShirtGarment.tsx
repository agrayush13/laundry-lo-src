import React from 'react';
import { CycleStep } from '../../../config/cycleConfig';
import GarmentPrint from './GarmentPrint';
import Peg from './Peg';
import styles from './garments.module.scss';

/** A collared shirt in soap pink, carrying the second step. */
const ShirtGarment: React.FC<{ step: CycleStep }> = ({ step }) => (
    <>
        <g className={styles.shadow}>
            <path
                d="M-44 8 L-88 34 L-76 64 L-40 46 Z"
                key="M-44 8 L-88 34"
            />
            <path
                d="M44 8 L88 34 L76 64 L40 46 Z"
                key="M44 8 L88 34 L"
            />
            <path
                d="M-52 14 C-52 10 -48 8 -44 8 H-16 L0 26 L16 8 H44 C48 8 52 10 52 14 V172 C52 176 48 178 44 178 H-44 C-48 178 -52 176 -52 172 Z"
                key="M-52 14 C-52 1"
            />
        </g>
        <path
            className={styles.pink}
            d="M-44 8 L-88 34 L-76 64 L-40 46 Z"
        />
        <path
            className={styles.pink}
            d="M44 8 L88 34 L76 64 L40 46 Z"
        />
        <path
            className={styles.pink}
            d="M-52 14 C-52 10 -48 8 -44 8 H-16 L0 26 L16 8 H44 C48 8 52 10 52 14 V172 C52 176 48 178 44 178 H-44 C-48 178 -52 176 -52 172 Z"
        />

        {/* Collar and placket: seams in the cloth's own shade, not lines on it. */}
        <path
            className={styles.seam}
            d="M-16 8 L0 26 L-5 6"
        />
        <path
            className={styles.seam}
            d="M16 8 L0 26 L5 6"
        />
        <path
            className={styles.seam}
            d="M0 26 V172"
        />
        <circle
            className={styles.seam}
            cx="0"
            cy="124"
            r="3.5"
        />
        <circle
            className={styles.seam}
            cx="0"
            cy="154"
            r="3.5"
        />

        <GarmentPrint
            step={step}
            y={74}
        />
        <Peg />
    </>
);

export default ShirtGarment;
