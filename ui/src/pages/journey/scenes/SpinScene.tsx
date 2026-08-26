import React from 'react';
import { DRUM_MARK } from '../../../common-ui/drum-mark/drumGeometry';
import DrumMark from '../../../common-ui/drum-mark/DrumMark';
import { SPIN } from '../../../config/cycleConfig';
import { useSpin } from '../../../hooks/useSpin';
import styles from './spinScene.module.scss';

/** Two runs of 0-9, so a strip can spin past the wrap without a seam. */
const STRIP = Array.from({ length: 20 }, (_, index) => index % 10);

/**
 * Water leaves a spinning drum radially, so the drops are an even fan of angles
 * around it rather than a scatter of hand placed points. Every few degrees of
 * the rim throws its own drop, all of them at once and all of the time, which is
 * what a drum spraying all the way round looks like.
 *
 * Every one is thrown straight out from the axis, and the hook is what decides
 * how far each gets, how long it takes and when in the cycle it leaves: the
 * angles are the composition, the rest is weather.
 */
const SPRAY_COUNT = 24;
const DROPLETS = Array.from({ length: SPRAY_COUNT }, (_, index) => (index / SPRAY_COUNT) * 360);

/**
 * Three numbers, enormous, arranged around the centrifuge's axis. The drum sits
 * on that axis, which is why the corner dial steps aside while this section is
 * on screen.
 *
 * Each digit is a slot strip. At rest it shows its own number and nothing else
 * moves; the spin only exists while the page is being scrolled. The strips are
 * hidden from assistive technology, which would otherwise read every digit from
 * zero to nine three times over, and the real figure sits beside them as text.
 */
const SpinScene: React.FC = () => {
    // The scene starts its own choreography: it is lazy, and a hook that ran
    // with the page would find none of this markup.
    useSpin();

    return (
        // The weather and the pool are siblings of the numbers rather than
        // children of them. Both are positioned against the section, which is
        // the full width of the window, so the water gathers right across the
        // bottom of the screen instead of stopping at the edge of the column the
        // figures happen to be set in.
        <>
            <div
                className={styles.spin}
                data-spin="scene"
            >
                <div className={styles.stats}>
                    {SPIN.stats.map((stat) => (
                        <div
                            className={styles.stat}
                            key={stat.label}
                        >
                            <p className={styles.value}>
                                <span className="visually-hidden">
                                    {stat.value}
                                    {stat.suffix}
                                </span>
                                <span aria-hidden="true">
                                    {Array.from(stat.value).map((digit, index) => (
                                        <span
                                            className={styles.slot}
                                            data-spin="slot"
                                            data-digit={digit}
                                            key={`${stat.label}-${index}`}
                                            style={{ '--slot': digit } as React.CSSProperties}
                                        >
                                            <span
                                                className={styles.strip}
                                                data-spin="strip"
                                            >
                                                {STRIP.map((face, position) => (
                                                    <span key={`${face}-${position}`}>{face}</span>
                                                ))}
                                            </span>
                                        </span>
                                    ))}
                                    {stat.suffix && (
                                        <span
                                            className={styles.suffix}
                                            data-accent={stat.suffix === '+' ? 'true' : undefined}
                                        >
                                            {stat.suffix}
                                        </span>
                                    )}
                                </span>
                            </p>
                            <p className={styles.label}>{stat.label}</p>
                        </div>
                    ))}

                    {/* The axis the numbers turn around, in the middle of the
                composition rather than floating over it. */}
                    <DrumMark
                        className={styles.axis}
                        level={DRUM_MARK.restingWater}
                        perforated
                    />
                </div>
            </div>

            {/* Water thrown off the drum, in every direction it can leave by. */}
            <div
                className={styles.weather}
                aria-hidden="true"
            >
                {DROPLETS.map((angle) => (
                    <span
                        className={styles.droplet}
                        data-angle={angle}
                        data-spin="droplet"
                        key={angle}
                    />
                ))}
            </div>

            <div
                className={styles.poolDrain}
                data-spin="pool-drain"
                aria-hidden="true"
            >
                <div
                    className={styles.pool}
                    data-spin="pool"
                />
            </div>
        </>
    );
};

export default SpinScene;
