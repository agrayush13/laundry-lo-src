import React from 'react';
import { Link } from 'react-router-dom';
import AsyncBoundary from '../../common-ui/async-boundary/AsyncBoundary';
import BackLink from '../../common-ui/back-link/BackLink';
import Icon from '../../common-ui/icons/Icon';
import Money from '../../common-ui/money/Money';
import { ICON_SIZE } from '../../config/brandConfig';
import { ORDERS_COPY } from '../../config/cartConfig';
import { ROUTES } from '../../config/navigationConfig';
import { itemCount } from '../../data/orders';
import { useAsync } from '../../hooks/useAsync';
import { getOrders } from '../../services/customerServices';
import { formatTimestampDate } from '../../utils/datesUtils';
import StatusBadge from './StatusBadge';
import styles from './bookings.module.scss';

const BookingsPage: React.FC = () => {
    const orders = useAsync((signal) => getOrders(signal), []);

    return (
        <div className={styles.bookings}>
            <div className={styles.bookingsInner}>
                <BackLink
                    label={ORDERS_COPY.back}
                    to={ROUTES.home}
                    spacing="lg"
                />

                <h1 className={styles.bookingsTitle}>{ORDERS_COPY.title}</h1>
                <AsyncBoundary
                    state={orders}
                    label="Loading your bookings"
                >
                    {(loadedOrders) => (
                        <>
                            <p className={styles.bookingsCount}>
                                {loadedOrders.length}{' '}
                                {loadedOrders.length === 1 ? 'order' : 'orders'}{' '}
                                {ORDERS_COPY.countSuffix}
                            </p>

                            <ul className={styles.bookingsList}>
                                {loadedOrders.map((order) => (
                                    <li key={order.id}>
                                        <Link
                                            className={`card ${styles.orderCard}`}
                                            to={ROUTES.order(order.id)}
                                        >
                                            <div className={styles.orderCardHead}>
                                                <h2 className={styles.orderCardPartner}>
                                                    {order.partner.name}
                                                </h2>
                                                <StatusBadge status={order.status} />
                                                <Icon
                                                    name="chevron-right"
                                                    className={styles.orderCardChevron}
                                                    size={ICON_SIZE.lg}
                                                />
                                            </div>

                                            <p className={styles.orderCardId}>
                                                {ORDERS_COPY.orderPrefix}
                                                {order.reference}
                                            </p>

                                            <ul className={styles.orderCardLines}>
                                                {order.lines.map((line) => (
                                                    <li key={line.itemId}>
                                                        {line.name} ×{line.quantity}
                                                    </li>
                                                ))}
                                            </ul>

                                            <footer className={styles.orderCardFooter}>
                                                <p className={styles.orderCardMeta}>
                                                    <span>
                                                        <Icon
                                                            name="clock"
                                                            size={ICON_SIZE.sm}
                                                        />
                                                        {formatTimestampDate(order.placedAt)}
                                                    </span>
                                                    <span>
                                                        <Icon
                                                            name="pin"
                                                            size={ICON_SIZE.sm}
                                                        />
                                                        {itemCount(order)} {ORDERS_COPY.itemsSuffix}
                                                    </span>
                                                </p>
                                                <p className={styles.orderCardTotal}>
                                                    <Money value={order.totals.total} />
                                                </p>
                                            </footer>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </AsyncBoundary>
            </div>
        </div>
    );
};

export default BookingsPage;
