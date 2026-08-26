import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../../common-ui/icons/Icon';
import { DEFAULT_PIN_CODE } from '../../../config/bookingConfig';
import { RINSE, SERVICE_CARDS } from '../../../config/cycleConfig';
import { ROUTES } from '../../../config/navigationConfig';
import { SERVICE_TYPES, formatPrice } from '../../../data/services';
import { useRinseEntry } from '../../../hooks/useRinseEntry';
import DrainCurtain from './DrainCurtain';
import bubbleStyles from './bubbles.module.scss';
import styles from './rinseScene.module.scss';

/**
 * The calmest screen on the site, deliberately: the hero was theatrical and the
 * spin is a burst, so this one just says what laundrylo does and what it costs.
 *
 * Prices come from the catalogue the cart uses, so a card cannot promise a
 * number the booking flow will not honour.
 */
const RinseScene: React.FC = () => {
    // The scene starts its own choreography: it is lazy, and a hook that ran
    // with the page would find none of this markup.
    useRinseEntry();

    return (
        <div className={styles.rinse}>
            <DrainCurtain />

            {/* Soap, on its way up to the surface. No text inside them. */}
            <div
                className={bubbleStyles.bubbles}
                aria-hidden="true"
            >
                {[18, 39, 61, 82].map((left) => (
                    <span
                        className={bubbleStyles.bubble}
                        data-rinse="bubble"
                        key={left}
                        style={{ left: `${left}%` }}
                    />
                ))}
            </div>

            <h2 className={styles.rinseTitle}>{RINSE.title}</h2>

            <ul className={styles.rinseGrid}>
                {SERVICE_TYPES.map((service) => {
                    const card = SERVICE_CARDS[service.id];

                    return (
                        <li key={service.id}>
                            <Link
                                className={`${styles.rinseCard} ${styles[card.tint]}`}
                                data-rinse="card"
                                to={ROUTES.laundriesForService(service.id, DEFAULT_PIN_CODE)}
                            >
                                <Icon
                                    className={styles.rinseCardIcon}
                                    name={card.icon}
                                />
                                <h3 className={styles.rinseCardName}>{service.name}</h3>
                                <p className={styles.rinseCardCopy}>{service.longDescription}</p>
                                <span className={styles.rinseCardPrice}>
                                    {RINSE.pricePrefix} <strong>{formatPrice(service)}</strong>
                                    <Icon
                                        className={styles.rinseCardArrow}
                                        name="arrow-right"
                                    />
                                </span>
                            </Link>
                        </li>
                    );
                })}
            </ul>

            <Link
                className={styles.rinseCta}
                to={ROUTES.laundriesForPin(DEFAULT_PIN_CODE)}
            >
                {RINSE.cta}
                <Icon name="arrow-right" />
            </Link>
        </div>
    );
};

export default RinseScene;
