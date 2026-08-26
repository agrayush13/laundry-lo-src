import React from 'react';
import PinCodeSearch from '../../../common-ui/pin-code-search/PinCodeSearch';
import { WASH } from '../../../config/cycleConfig';
import WashHeadline from './WashHeadline';
import WashingMachine from './WashingMachine';
import styles from './washScene.module.scss';

/**
 * The problem, stated plainly, next to the machine that is about to wash it
 * away. Everything here is static text and one illustration: this is the LCP,
 * and it paints before any animation code exists.
 */
const WashScene: React.FC = () => (
    <div className={styles.wash}>
        <div className={styles.washCopy}>
            <p className={styles.washEyebrow}>{WASH.eyebrow}</p>

            <WashHeadline />

            <p className={styles.washSubtitle}>{WASH.subtitle}</p>

            <PinCodeSearch className={styles.washSearch} />

            <ul className={styles.washMicro}>
                {WASH.micro.map((claim) => (
                    <li key={claim}>{claim}</li>
                ))}
            </ul>
        </div>

        <WashingMachine className={styles.washMachine} />

        <p className={styles.washCue}>
            {WASH.scrollCue}
            <span aria-hidden="true">↓</span>
        </p>
    </div>
);

export default WashScene;
