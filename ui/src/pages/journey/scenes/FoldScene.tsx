import React from 'react';
import { Link } from 'react-router-dom';
import Money from '../../../common-ui/money/Money';
import { FOLD } from '../../../config/cycleConfig';
import { MEMBERSHIP_SECTION } from '../../../config/membershipConfig';
import { ROUTES } from '../../../config/navigationConfig';
import { useFold } from '../../../hooks/useFold';
import PressShirt from './PressShirt';
import styles from './foldScene.module.scss';

const { card, benefits } = MEMBERSHIP_SECTION;

/**
 * Plus, pressed and folded into a shirt. The perks are read from the membership
 * config, so this section can only promise what the booking summary applies.
 *
 * The drawing is hidden from assistive technology and the same three perks are a
 * plain list beside it, which is also what makes them readable while the shirt
 * is folded up.
 */
const FoldScene: React.FC = () => {
    // The scene starts its own choreography: it is lazy, and a hook that ran
    // with the page would find none of this markup.
    useFold();

    return (
        <div className={styles.fold}>
            <h2 className={styles.foldTitle}>{FOLD.title}</h2>

            <ul className="visually-hidden">
                {benefits.map((benefit) => (
                    <li key={benefit.title}>
                        {benefit.title}. {benefit.description}
                    </li>
                ))}
            </ul>

            <div className={styles.foldStage}>
                <PressShirt benefits={benefits} />

                {/* Price and call to action live on the tag, never across a crease. */}
                <div
                    className={styles.foldTag}
                    data-fold="tag"
                >
                    <p className={styles.foldPrice}>
                        <Money value={card.price} />
                        <span>{card.period}</span>
                    </p>
                    <Link
                        className={styles.foldCta}
                        to={ROUTES.plus}
                    >
                        {FOLD.cta}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default FoldScene;
