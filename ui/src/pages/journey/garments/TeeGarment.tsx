import React from 'react';
import { CycleStep } from '../../../config/cycleConfig';
import GarmentPrint from './GarmentPrint';
import Peg from './Peg';
import styles from './garments.module.scss';

/**
 * The hero's t-shirt, back from the wash without its stain. Its body is wider
 * than the letter's stem was: the step is printed across the chest, and it has
 * to fit there at full sway.
 */
const SHAPES = [
    'M-44 8 L-86 30 L-74 60 L-40 44 Z',
    'M44 8 L86 30 L74 60 L40 44 Z',
    'M-50 12 C-50 9 -47 8 -44 8 H-17 C-15 26 -8 31 0 31 C8 31 15 26 17 8 H44 C47 8 50 9 50 12 V170 C50 174 47 176 44 176 H-44 C-47 176 -50 174 -50 170 Z',
];

const TeeGarment: React.FC<{ step: CycleStep }> = ({ step }) => (
    <>
        <g className={styles.shadow}>
            {SHAPES.map((d) => (
                <path
                    d={d}
                    key={d.slice(0, 14)}
                />
            ))}
        </g>
        {SHAPES.map((d) => (
            <path
                className={styles.ink}
                d={d}
                key={d.slice(0, 14)}
            />
        ))}
        <GarmentPrint
            step={step}
            y={92}
            onInk
        />
        <Peg />
    </>
);

export default TeeGarment;
