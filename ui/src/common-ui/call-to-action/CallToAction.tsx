import React from 'react';
import { Link } from 'react-router-dom';
import { CTA_SECTION } from '../../config/homeConfig';
import { useAuth } from '../../context/AuthContext';
import Icon from '../icons/Icon';
import styles from './callToAction.module.scss';

const CallToAction: React.FC = () => {
    const { user } = useAuth();
    // Someone already signed in has no reason to be sold a sign-up.
    const { subtitle, primary } = user ? CTA_SECTION.authenticated : CTA_SECTION.guest;

    return (
        <section className="section">
            <div className="container">
                <div className={styles.cta}>
                    <h2 className={styles.ctaTitle}>{CTA_SECTION.title}</h2>
                    <p className={styles.ctaSubtitle}>{subtitle}</p>
                    <div className={styles.ctaActions}>
                        <Link
                            className={`button ${styles.ctaButton} ${styles.ctaButtonSolid}`}
                            to={primary.href}
                        >
                            {primary.label}
                            <Icon name="arrow-right" />
                        </Link>
                        <a
                            className={`button ${styles.ctaButton} ${styles.ctaButtonGhost}`}
                            href={CTA_SECTION.secondary.href}
                        >
                            {CTA_SECTION.secondary.label}
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CallToAction;
