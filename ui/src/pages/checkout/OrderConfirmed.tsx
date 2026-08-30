import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import Icon from '../../common-ui/icons/Icon';
import { CONFIRMATION_COPY } from '../../config/bookingConfig';
import { ICON_SIZE } from '../../config/brandConfig';
import { ROUTES } from '../../config/navigationConfig';
import { useConfirmedOrder } from '../../hooks/useConfirmedOrder';
import styles from './checkout.module.scss';

const OrderConfirmed: React.FC = () => {
    const { orderId, orderReference } = useConfirmedOrder();

    // Reached without completing a booking (e.g. a direct link or refresh).
    if (!orderId) {
        return (
            <Navigate
                to={ROUTES.home}
                replace
            />
        );
    }

    return (
        <div className={styles.confirmed}>
            <span className={styles.confirmedIcon}>
                <Icon
                    name="check-circle"
                    size={ICON_SIZE.hero}
                />
            </span>
            <h1 className={styles.confirmedTitle}>{CONFIRMATION_COPY.title}</h1>
            <p className={styles.confirmedText}>{CONFIRMATION_COPY.body}</p>
            <p className={styles.confirmedOrder}>
                {CONFIRMATION_COPY.orderPrefix}
                {orderReference}
            </p>

            <div className={styles.confirmedActions}>
                <Link
                    className="button button--primary"
                    to={ROUTES.home}
                >
                    <Icon
                        name="home"
                        size={ICON_SIZE.md}
                    />
                    {CONFIRMATION_COPY.primary}
                </Link>
                <Link
                    className={`button ${styles.confirmedSecondary}`}
                    to={ROUTES.laundries}
                >
                    {CONFIRMATION_COPY.secondary}
                </Link>
            </div>
        </div>
    );
};

export default OrderConfirmed;
