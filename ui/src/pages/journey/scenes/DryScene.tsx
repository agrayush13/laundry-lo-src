import React from 'react';
import { DRY } from '../../../config/cycleConfig';
import { useClothesline } from '../../../hooks/useClothesline';
import Clothesline from './Clothesline';
import styles from './dryScene.module.scss';

/**
 * How it works, hung out to dry. The four steps are printed on the garments
 * themselves, with no tags and no leader lines, and the same four are a plain
 * ordered list for anyone who is listening to the page rather than looking at
 * it. The drawing is hidden from assistive technology so the steps are announced
 * once, in order, as a list.
 */
const DryScene: React.FC = () => {
    // The scene starts its own choreography: it is lazy, and a hook that ran
    // with the page would find none of this markup.
    useClothesline();

    return (
        <div className={styles.dry}>
            <ol className="visually-hidden">
                {DRY.steps.map((step) => (
                    <li key={step.number}>{step.label}</li>
                ))}
            </ol>

            <Clothesline />

            <p className={styles.drySignoff}>{DRY.signoff}</p>
        </div>
    );
};

export default DryScene;
