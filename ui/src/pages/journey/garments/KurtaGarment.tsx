import React from 'react';
import { CycleStep } from '../../../config/cycleConfig';
import GarmentPrint from './GarmentPrint';
import Peg from './Peg';
import styles from './garments.module.scss';

/** A mint kurta, longer than the shirts and slit at the hem, third step. */
const KurtaGarment: React.FC<{ step: CycleStep }> = ({ step }) => (
    <>
        <g className={styles.shadow}>
            <path
                d="M-40 6 L-74 30 L-64 56 L-36 42 Z"
                key="M-40 6 L-74 30"
            />
            <path
                d="M40 6 L74 30 L64 56 L36 42 Z"
                key="M40 6 L74 30 L"
            />
            <path
                d="M-46 10 C-46 7 -43 6 -40 6 H-13 C-11 22 -5 26 0 26 C5 26 11 22 13 6 H40 C43 6 46 7 46 10 L52 186 C52 190 49 192 46 192 H-46 C-49 192 -52 190 -52 186 Z"
                key="M-46 10 C-46 7"
            />
        </g>
        <path
            className={styles.mint}
            d="M-40 6 L-74 30 L-64 56 L-36 42 Z"
        />
        <path
            className={styles.mint}
            d="M40 6 L74 30 L64 56 L36 42 Z"
        />
        <path
            className={styles.mint}
            d="M-46 10 C-46 7 -43 6 -40 6 H-13 C-11 22 -5 26 0 26 C5 26 11 22 13 6 H40 C43 6 46 7 46 10 L52 186 C52 190 49 192 46 192 H-46 C-49 192 -52 190 -52 186 Z"
        />

        {/* Mandarin collar, and the slits a kurta is cut with. */}
        <path
            className={styles.seam}
            d="M-13 8 C-6 16 6 16 13 8"
        />
        <path
            className={styles.seam}
            d="M-34 150 V190"
        />
        <path
            className={styles.seam}
            d="M34 150 V190"
        />

        <GarmentPrint
            step={step}
            y={88}
        />
        <Peg />
    </>
);

export default KurtaGarment;
