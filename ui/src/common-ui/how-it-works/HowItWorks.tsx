import React from 'react';
import { ICON_SIZE } from '../../config/brandConfig';
import { HOW_IT_WORKS_SECTION } from '../../config/homeConfig';
import Icon from '../icons/Icon';
import SectionHead from '../section-head/SectionHead';
import styles from './howItWorks.module.scss';

const HowItWorks: React.FC = () => (
    <section
        className="section section--muted"
        id={HOW_IT_WORKS_SECTION.id}
    >
        <div className="container">
            <SectionHead
                title={HOW_IT_WORKS_SECTION.title}
                subtitle={HOW_IT_WORKS_SECTION.subtitle}
            />

            <ol className={styles.steps}>
                {HOW_IT_WORKS_SECTION.steps.map(({ icon, title, description }, index) => (
                    <li
                        key={title}
                        className={styles.stepsItem}
                    >
                        <span className={styles.stepsMarker}>
                            <Icon
                                name={icon}
                                size={ICON_SIZE.xxl}
                            />
                            <span className={styles.stepsNumber}>
                                {String(index + 1).padStart(2, '0')}
                            </span>
                        </span>
                        <h3 className={styles.stepsTitle}>{title}</h3>
                        <p className={styles.stepsDescription}>{description}</p>
                    </li>
                ))}
            </ol>
        </div>
    </section>
);

export default HowItWorks;
