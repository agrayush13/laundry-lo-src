import React from 'react';
import styles from './pageFallback.module.scss';

/** Holds vertical space while a lazily-loaded route arrives. */
const PageFallback: React.FC = () => (
    <div
        className={styles.fallback}
        role="status"
        aria-live="polite"
    >
        <span className={styles.spinner} />
        <span className="visually-hidden">Loading</span>
    </div>
);

export default PageFallback;
