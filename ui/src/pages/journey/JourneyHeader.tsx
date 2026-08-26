import React from 'react';
import Logo from '../../common-ui/logo/Logo';
import { BRAND } from '../../config/brandConfig';
import { CYCLE_HEADER } from '../../config/cycleConfig';
import { ROUTES } from '../../config/navigationConfig';
import { useCycleTour } from '../../hooks/useCycleTour';
import styles from './journeyHeader.module.scss';

/**
 * Two items, and no chrome that competes with the cycle: no cart, no sign-in, no
 * theme toggle. It is not sticky either, because a fixed bar would eat a slice
 * of every full-viewport section below it.
 *
 * The second item plays the cycle rather than linking into it. It is a button
 * because it does something to this page instead of going to another one, and it
 * is absent entirely under reduced motion, where a page that scrolls itself is
 * the thing being asked for less of.
 */
const JourneyHeader: React.FC = () => {
    const { available, playing, play, stop } = useCycleTour();
    const { play: playLabel, stop: stopLabel } = CYCLE_HEADER.tour;

    return (
        <header className={styles.header}>
            <a
                className={styles.headerBrand}
                href={ROUTES.home}
                aria-label={`${BRAND.name} home`}
            >
                <Logo />
            </a>

            {available && (
                <button
                    className={styles.headerTour}
                    type="button"
                    onClick={playing ? stop : play}
                >
                    {playing ? stopLabel : playLabel}
                </button>
            )}
        </header>
    );
};

export default JourneyHeader;
