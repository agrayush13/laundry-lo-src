import React from 'react';
import DrumMark from '../drum-mark/DrumMark';
import styles from './pageFallback.module.scss';

/**
 * The drum, with water turning over inside it. Shown while a route's chunk is on
 * its way and never faked for effect: if this is on screen, something is
 * genuinely still loading.
 */
const PageFallback: React.FC = () => (
    <div
        className={styles.fallback}
        role="status"
        aria-label="Loading"
    >
        <div className={styles.fallbackDrum}>
            <DrumMark level={0.45} />
        </div>
    </div>
);

export default PageFallback;
