import React from 'react';
import { Navigate } from 'react-router-dom';
import BackLink from '../../common-ui/back-link/BackLink';
import ComingSoonButton from '../../common-ui/coming-soon-button/ComingSoonButton';
import Icon from '../../common-ui/icons/Icon';
import Money from '../../common-ui/money/Money';
import { BRAND, ICON_SIZE } from '../../config/brandConfig';
import { ORDERS_COPY } from '../../config/cartConfig';
import { ROUTES } from '../../config/navigationConfig';
import { useOrder } from '../../hooks/useOrder';
import { buildTimeline, formatOrderAddress } from '../../utils/ordersUtils';
import StatusBadge from './StatusBadge';
import styles from './bookings.module.scss';

const OrderDetailPage: React.FC = () => {
    const order = useOrder();

    if (!order) {
        return (
            <Navigate
                to={ROUTES.bookings}
                replace
            />
        );
    }

    return (
        <div className={styles.order}>
            <div className={styles.orderInner}>
                <BackLink
                    label={ORDERS_COPY.allOrders}
                    to={ROUTES.bookings}
                    spacing="lg"
                />

                <section className={`card ${styles.orderSummary}`}>
                    <div>
                        <p className={styles.orderLabel}>{ORDERS_COPY.orderId}</p>
                        <h1 className={styles.orderId}>{order.reference}</h1>
                        <p className={styles.orderMeta}>
                            <span className={styles.orderPartner}>{order.partner.name}</span>
                            {' • '}
                            {order.lines.length} {ORDERS_COPY.servicesSuffix}
                            {' • '}
                            <strong>
                                <Money value={order.totals.total} />
                            </strong>
                        </p>
                    </div>
                    <StatusBadge status={order.status} />
                </section>

                <section className={`card ${styles.orderCard}`}>
                    <h2 className={styles.orderHeading}>{ORDERS_COPY.timeline}</h2>
                    <ol className={styles.timeline}>
                        {buildTimeline(order.events).map((entry) => (
                            <li
                                key={entry.label}
                                className={styles.timelineEntry}
                                data-state={entry.state}
                            >
                                <span
                                    className={styles.timelineDot}
                                    aria-hidden="true"
                                />
                                <p className={styles.timelineLabel}>{entry.label}</p>
                                <p className={styles.timelineDetail}>{entry.detail}</p>
                            </li>
                        ))}
                    </ol>
                </section>

                <section className={`card ${styles.orderCard}`}>
                    <h2 className={styles.orderHeading}>{ORDERS_COPY.items}</h2>
                    <ul className={styles.orderItems}>
                        {order.lines.map((line) => (
                            <li key={line.itemId}>
                                <span>
                                    <Icon
                                        name="box"
                                        size={ICON_SIZE.sm}
                                    />
                                    {line.name}
                                    <em>×{line.quantity}</em>
                                </span>
                                <strong>
                                    <Money value={line.amount} />
                                </strong>
                            </li>
                        ))}
                    </ul>
                    <p className={styles.orderTotal}>
                        <span>{ORDERS_COPY.total}</span>
                        <strong>
                            <Money value={order.totals.total} />
                        </strong>
                    </p>
                </section>

                <section className={`card ${styles.orderCard}`}>
                    <h2 className={styles.orderHeading}>{ORDERS_COPY.deliveryAddress}</h2>
                    <address className={styles.orderAddress}>{formatOrderAddress(order)}</address>
                </section>

                <div className={styles.orderSupport}>
                    <a
                        className={`button ${styles.orderSupportButton}`}
                        href={`tel:${BRAND.supportPhone}`}
                    >
                        <Icon
                            name="phone"
                            size={ICON_SIZE.md}
                        />
                        {ORDERS_COPY.callSupport}
                    </a>
                    <ComingSoonButton
                        className={`button ${styles.orderSupportButton}`}
                        icon="chat"
                        label={ORDERS_COPY.chat}
                    />
                </div>
            </div>
        </div>
    );
};

export default OrderDetailPage;
