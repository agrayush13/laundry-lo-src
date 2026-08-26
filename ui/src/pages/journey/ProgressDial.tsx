import React from 'react';
import DrumMark from '../../common-ui/drum-mark/DrumMark';
import { SPIN } from '../../config/cycleConfig';
import { useCycleProgress } from '../../hooks/useCycleProgress';
import { useSectionInView } from '../../hooks/useSectionInView';
import styles from './progressDial.module.scss';

/**
 * Where the visitor is in the cycle, told the way the rest of the page tells
 * everything: as a drum filling with water. No label, no percentage.
 *
 * It steps aside for the spin, which stands its own drum on the centrifuge's
 * axis. Two water circles on screen at once read as a bug rather than a motif.
 */
const ProgressDial: React.FC = () => {
    const progress = useCycleProgress();
    const spinning = useSectionInView(SPIN.meta.id);

    return (
        <div
            className={`${styles.dial} ${spinning ? styles.dialHidden : ''}`}
            aria-hidden="true"
        >
            <DrumMark level={progress} />
        </div>
    );
};

export default ProgressDial;
