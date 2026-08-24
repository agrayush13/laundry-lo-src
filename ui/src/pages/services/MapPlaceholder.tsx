import React from 'react';
import Icon from '../../common-ui/icons/Icon';
import { ICON_SIZE } from '../../config/brandConfig';
import { LISTING_COPY } from '../../config/listingConfig';
import styles from './mapPlaceholder.module.scss';

interface MapPlaceholderProps {
    /** Pins stand in for the partners in the current result set. */
    pinCount: number;
}

// Fixed offsets keep the stand-in pins from jumping between renders.
const PIN_POSITIONS = [
    { top: '12%', left: '20%' },
    { top: '20%', left: '68%' },
    { top: '30%', left: '42%' },
    { top: '74%', left: '28%' },
    { top: '82%', left: '62%' },
    { top: '66%', left: '80%' },
];

const MapPlaceholder: React.FC<MapPlaceholderProps> = ({ pinCount }) => (
    <aside
        className={styles.mapView}
        aria-label={LISTING_COPY.mapTitle}
    >
        {PIN_POSITIONS.slice(0, pinCount).map((position, index) => (
            <span
                key={position.left + position.top}
                className={styles.mapViewPin}
                style={position}
                aria-hidden="true"
            >
                {index + 1}
            </span>
        ))}

        <div className={styles.mapViewBody}>
            <Icon
                name="navigation"
                size={ICON_SIZE.xxl}
                className={styles.mapViewIcon}
            />
            <p className={styles.mapViewTitle}>{LISTING_COPY.mapTitle}</p>
            <p className={styles.mapViewSubtitle}>{LISTING_COPY.mapSubtitle}</p>
        </div>
    </aside>
);

export default MapPlaceholder;
