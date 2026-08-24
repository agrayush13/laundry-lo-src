import React from 'react';
import { Link } from 'react-router-dom';
import { ICON_SIZE } from '../../config/brandConfig';
import { MEMBERSHIP_SECTION } from '../../config/homeConfig';
import { ROUTES } from '../../config/navigationConfig';
import Card from '../card/Card';
import Icon from '../icons/Icon';
import Money from '../money/Money';
import styles from './membership.module.scss';

const { eyebrow, planName, title, subtitle, card, benefitsLabel, benefits } = MEMBERSHIP_SECTION;

const Membership: React.FC = () => (
    <section
        className={`section ${styles.membership}`}
        id={MEMBERSHIP_SECTION.id}
    >
        <div className="container">
            <header className="section__head">
                <p className="eyebrow">
                    <Icon
                        name="sparkles"
                        size={ICON_SIZE.sm}
                    />
                    {eyebrow}
                    <Icon
                        name="sparkles"
                        size={ICON_SIZE.sm}
                    />
                </p>
                <h2 className="section__title">
                    {title.before}
                    <span className={styles.membershipAccent}>{planName}</span>
                </h2>
                <p className="section__subtitle">{subtitle}</p>
            </header>

            <div className={styles.membershipCard}>
                <span
                    className={styles.membershipCrown}
                    aria-hidden="true"
                >
                    <Icon
                        name="crown"
                        size={ICON_SIZE.xxl}
                    />
                </span>
                <h3 className={styles.membershipHeading}>
                    {card.heading.before}
                    <span className={styles.membershipAccent}>{planName}</span>
                </h3>
                <p className={styles.membershipTagline}>{card.tagline}</p>
                <p className={styles.membershipPrice}>
                    <Money value={card.price} /> <span>{card.period}</span>
                </p>
                <Link
                    className="button button--primary"
                    to={ROUTES.plus}
                >
                    <Icon
                        name="crown"
                        size={ICON_SIZE.md}
                    />
                    {card.cta}
                </Link>
            </div>

            <p className={`eyebrow ${styles.membershipBenefitsLabel}`}>
                <Icon
                    name="star"
                    size={ICON_SIZE.xs}
                    fill="currentColor"
                />
                {benefitsLabel}
                <Icon
                    name="star"
                    size={ICON_SIZE.xs}
                    fill="currentColor"
                />
            </p>

            <ul className={styles.membershipBenefits}>
                {benefits.map(({ icon, title: benefitTitle, description }) => (
                    <Card
                        as="li"
                        className={styles.membershipBenefit}
                        key={benefitTitle}
                    >
                        <span className={styles.membershipBenefitIcon}>
                            <Icon
                                name={icon}
                                size={ICON_SIZE.lg}
                            />
                        </span>
                        <h4 className={styles.membershipBenefitTitle}>{benefitTitle}</h4>
                        <p className={styles.membershipBenefitDescription}>{description}</p>
                    </Card>
                ))}
            </ul>
        </div>
    </section>
);

export default Membership;
