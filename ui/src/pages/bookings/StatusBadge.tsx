import React from 'react';
import Icon from '../../common-ui/icons/Icon';
import { ICON_SIZE } from '../../config/brandConfig';
import { STATUS_ICONS, STATUS_LABELS } from '../../config/ordersConfig';
import { OrderStatus } from '../../data/orders';
import styles from './bookings.module.scss';

const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => (
    <span
        className={styles.statusBadge}
        data-status={status}
    >
        <Icon
            name={STATUS_ICONS[status]}
            size={ICON_SIZE.xs}
        />
        {STATUS_LABELS[status]}
    </span>
);

export default StatusBadge;
