import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../common-ui/icons/Icon';
import { ROUTES } from '../../config/navigationConfig';
import { PARTNER_PORTAL_COPY } from '../../config/partnerOrdersConfig';
import styles from './partnerPortal.module.scss';

const PartnerAccessRequired: React.FC = () => (
    <section className={`card ${styles.accessState}`}>
        <span className={styles.accessIcon}>
            <Icon name="shield" />
        </span>
        <h2>{PARTNER_PORTAL_COPY.accessTitle}</h2>
        <p>{PARTNER_PORTAL_COPY.accessBody}</p>
        <Link
            className="button button--primary"
            to={ROUTES.home}
        >
            {PARTNER_PORTAL_COPY.returnHome}
        </Link>
    </section>
);

export default PartnerAccessRequired;
