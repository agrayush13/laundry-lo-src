import React from 'react';
import { Link } from 'react-router-dom';
import { ICON_SIZE } from '../../config/brandConfig';
import { LISTING_COPY, TAG_LABELS } from '../../config/listingConfig';
import { ROUTES } from '../../config/navigationConfig';
import { Partner } from '../../data/partners';
import { formatDistance, formatPartnerAddress } from '../../utils/partnersUtils';
import Icon from '../icons/Icon';
import styles from './partnerIdentity.module.scss';

interface PartnerIdentityProps {
    partner: Partner;
    /** `lg` heads the partner page; `sm` sits inside a listing card. */
    size?: 'sm' | 'lg';
    /** Links the name through to the partner page. */
    linkToPartner?: boolean;
}

/** Name, rating, address, tags and service facts - shared by card and page. */
const PartnerIdentity: React.FC<PartnerIdentityProps> = ({
    partner,
    size = 'sm',
    linkToPartner = false,
}) => {
    const Heading = size === 'lg' ? 'h1' : 'h2';

    return (
        <div
            className={styles.partnerIdentity}
            data-size={size}
        >
            <div className={styles.partnerIdentityHead}>
                <Heading className={styles.partnerIdentityName}>
                    {linkToPartner ? (
                        <Link to={ROUTES.laundry(partner.id)}>{partner.name}</Link>
                    ) : (
                        partner.name
                    )}
                </Heading>
                <p className={styles.partnerIdentityRating}>
                    <Icon
                        name="star"
                        size={ICON_SIZE.xs}
                        fill="currentColor"
                    />
                    {partner.rating.toFixed(1)} ({partner.reviewCount})
                </p>
            </div>

            <p className={styles.partnerIdentityAddress}>
                <Icon
                    name="pin"
                    size={ICON_SIZE.sm}
                />
                {formatPartnerAddress(partner.address)} • {formatDistance(partner.distanceMeters)}
            </p>

            <ul className={styles.partnerIdentityTags}>
                {partner.tags.map((tag) => (
                    <li key={tag}>{TAG_LABELS[tag]}</li>
                ))}
            </ul>

            <ul className={styles.partnerIdentityMeta}>
                <li>
                    <Icon
                        name="clock"
                        size={ICON_SIZE.sm}
                    />
                    {partner.turnaroundHours}
                    {LISTING_COPY.turnaroundSuffix}
                </li>
                <li>
                    <Icon
                        name="truck"
                        size={ICON_SIZE.sm}
                    />
                    {LISTING_COPY.freeDelivery}
                </li>
                <li>
                    <Icon
                        name="shield"
                        size={ICON_SIZE.sm}
                    />
                    {LISTING_COPY.verified}
                </li>
            </ul>
        </div>
    );
};

export default PartnerIdentity;
