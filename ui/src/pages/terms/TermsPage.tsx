import React from 'react';
import BackLink from '../../common-ui/back-link/BackLink';
import { TERMS_COPY } from '../../config/commonConfig';
import { ROUTES } from '../../config/navigationConfig';
import styles from './termsPage.module.scss';

/**
 * Short, and true. The footer links here, so the page has to exist; there is no
 * service behind it, so there is nothing to write terms about.
 */
const TermsPage: React.FC = () => (
    <div className={styles.terms}>
        <BackLink
            label={TERMS_COPY.back}
            to={ROUTES.home}
        />
        <h1 className={styles.termsTitle}>{TERMS_COPY.title}</h1>
        {TERMS_COPY.body.map((paragraph) => (
            <p
                className={styles.termsBody}
                key={paragraph}
            >
                {paragraph}
            </p>
        ))}
    </div>
);

export default TermsPage;
