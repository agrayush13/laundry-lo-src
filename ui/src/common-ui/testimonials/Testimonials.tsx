import React from 'react';
import { ICON_SIZE } from '../../config/brandConfig';
import { TESTIMONIALS_SECTION } from '../../config/homeConfig';
import Card from '../card/Card';
import Icon from '../icons/Icon';
import SectionHead from '../section-head/SectionHead';
import styles from './testimonials.module.scss';

const Testimonials: React.FC = () => (
    <section className="section section--muted">
        <div className="container">
            <SectionHead
                title={TESTIMONIALS_SECTION.title}
                subtitle={TESTIMONIALS_SECTION.subtitle}
            />

            <ul className={styles.testimonials}>
                {TESTIMONIALS_SECTION.items.map(({ quote, name, role }) => (
                    <Card
                        as="li"
                        className={styles.testimonialsItem}
                        key={name}
                    >
                        <p
                            className={styles.testimonialsStars}
                            aria-label={`${TESTIMONIALS_SECTION.rating} out of 5 stars`}
                        >
                            {Array.from({ length: TESTIMONIALS_SECTION.rating }, (_, index) => (
                                <Icon
                                    key={index}
                                    name="star"
                                    size={ICON_SIZE.md}
                                    fill="currentColor"
                                />
                            ))}
                        </p>
                        <blockquote className={styles.testimonialsQuote}>
                            &ldquo;{quote}&rdquo;
                        </blockquote>
                        <p className={styles.testimonialsName}>{name}</p>
                        <p className={styles.testimonialsRole}>{role}</p>
                    </Card>
                ))}
            </ul>
        </div>
    </section>
);

export default Testimonials;
