import React, { lazy, useRef } from 'react';
import { DELIVER, DRY, FOLD, RINSE, SPIN, WASH } from '../../config/cycleConfig';
import { useCycleAnchors } from '../../hooks/useCycleAnchors';
import { useCycleScroll } from '../../hooks/useCycleScroll';
import { useThemeLock } from '../../hooks/useThemeLock';
import { useWashScrub } from '../../hooks/useWashScrub';
import CycleSection from './CycleSection';
import JourneyHeader from './JourneyHeader';
import LazyScene from './LazyScene';
import ProgressDial from './ProgressDial';
import WashScene from './scenes/WashScene';
import styles from './journey.module.scss';

// The wash paints immediately; the rest of the cycle arrives a section ahead of
// the visitor.
const RinseScene = lazy(() => import('./scenes/RinseScene'));
const SpinScene = lazy(() => import('./scenes/SpinScene'));
const DryScene = lazy(() => import('./scenes/DryScene'));
const FoldScene = lazy(() => import('./scenes/FoldScene'));
const DeliverScene = lazy(() => import('./scenes/DeliverScene'));

/**
 * The journey is one wash cycle: scroll position is cycle progress, and each
 * section is a phase of it. See docs/journey.md.
 *
 * It is a page of its own rather than the homepage. The homepage is the product
 * marketing page and stays that way; this is the same story told as a thing that
 * happens, and the two read from the same configuration so a figure quoted here
 * cannot differ from the one quoted there.
 */
const JourneyPage: React.FC = () => {
    const washRef = useRef<HTMLElement>(null);

    // A dark wash cycle is a different design, not a variant of this one.
    useThemeLock('light');
    useCycleScroll();
    useCycleAnchors();
    useWashScrub(washRef);

    return (
        <div
            className={styles.cycle}
            data-journey="page"
        >
            <JourneyHeader />

            <CycleSection
                meta={WASH.meta}
                numbered={false}
                ref={washRef}
            >
                <WashScene />
            </CycleSection>

            <CycleSection meta={RINSE.meta}>
                <LazyScene>
                    <RinseScene />
                </LazyScene>
            </CycleSection>

            <CycleSection meta={SPIN.meta}>
                <LazyScene>
                    <SpinScene />
                </LazyScene>
            </CycleSection>

            <CycleSection meta={DRY.meta}>
                <LazyScene>
                    <DryScene />
                </LazyScene>
            </CycleSection>

            <CycleSection meta={FOLD.meta}>
                <LazyScene>
                    <FoldScene />
                </LazyScene>
            </CycleSection>

            <CycleSection meta={DELIVER.meta}>
                <LazyScene>
                    <DeliverScene />
                </LazyScene>
            </CycleSection>

            <ProgressDial />
        </div>
    );
};

export default JourneyPage;
