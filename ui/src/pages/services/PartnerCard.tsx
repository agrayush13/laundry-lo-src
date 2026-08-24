import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../../common-ui/card/Card';
import Money from '../../common-ui/money/Money';
import PartnerIdentity from '../../common-ui/partner-identity/PartnerIdentity';
import { LISTING_COPY } from '../../config/listingConfig';
import { ROUTES } from '../../config/navigationConfig';
import { Partner } from '../../data/partners';
import styles from './partnerCard.module.scss';

interface PartnerCardProps {
    partner: Partner;
}

const PartnerCard: React.FC<PartnerCardProps> = ({ partner }) => (
    <Card
        as="article"
        className={styles.partner}
    >
        <div className={styles.partnerMedia}>
            <img
                className={styles.partnerImage}
                src={partner.image.url}
                alt={partner.image.alt}
                loading="lazy"
                data-closed={!partner.isOpen}
            />
            {!partner.isOpen && <span className={styles.partnerClosed}>{LISTING_COPY.closed}</span>}
        </div>

        <div className={styles.partnerBody}>
            <PartnerIdentity
                partner={partner}
                linkToPartner
            />

            <footer className={styles.partnerFooter}>
                <p className={styles.partnerPrice}>
                    <span>{LISTING_COPY.startingFrom}</span>
                    <strong>
                        <Money
                            value={partner.startingPrice}
                            unit={partner.startingPrice.unit}
                        />
                    </strong>
                </p>
                {partner.isOpen ? (
                    <Link
                        className="button button--primary"
                        to={ROUTES.laundry(partner.id)}
                    >
                        {LISTING_COPY.book}
                    </Link>
                ) : (
                    <button
                        className="button button--primary"
                        type="button"
                        disabled
                    >
                        {LISTING_COPY.book}
                    </button>
                )}
            </footer>
        </div>
    </Card>
);

export default PartnerCard;
