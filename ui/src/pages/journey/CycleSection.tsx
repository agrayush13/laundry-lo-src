import React from 'react';
import { CycleSectionMeta } from '../../config/cycleConfig';
import styles from './cycleSection.module.scss';

interface CycleSectionProps {
    meta: CycleSectionMeta;
    /** The hero states its own place in the cycle, so it skips the numbering. */
    numbered?: boolean;
    className?: string;
    children: React.ReactNode;
}

/**
 * One phase of the cycle, and exactly one viewport tall. Short content centres
 * in the space rather than stacking at the top, because a section that ends
 * early reads as a page that ran out rather than a cycle that is still turning.
 */
const CycleSection = React.forwardRef<HTMLElement, CycleSectionProps>(
    ({ meta, numbered = true, className, children }, ref) => (
        <section
            className={[styles.section, className].filter(Boolean).join(' ')}
            id={meta.id}
            ref={ref}
            aria-label={meta.name}
        >
            {numbered && (
                <p className={styles.eyebrow}>
                    <span className={styles.eyebrowNumber}>{meta.number}</span>
                    <span aria-hidden="true">·</span>
                    {meta.name}
                </p>
            )}
            {children}
        </section>
    )
);

CycleSection.displayName = 'CycleSection';

export default CycleSection;
