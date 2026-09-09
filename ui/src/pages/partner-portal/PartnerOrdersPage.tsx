import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AsyncBoundary from '../../common-ui/async-boundary/AsyncBoundary';
import Icon from '../../common-ui/icons/Icon';
import Money from '../../common-ui/money/Money';
import { API_COPY } from '../../config/apiConfig';
import { ICON_SIZE } from '../../config/brandConfig';
import { ROUTES } from '../../config/navigationConfig';
import {
    PARTNER_EVENT_LABELS,
    PARTNER_ORDER_FILTERS,
    PARTNER_PORTAL_COPY,
    type PartnerOrderFilter,
} from '../../config/partnerOrdersConfig';
import { usePartnerOrders } from '../../hooks/usePartnerOrders';
import type { PartnerOrderSummary } from '../../models/partnerOrderModels';
import { formatEventTime, formatSlotRange, formatTimestampDate } from '../../utils/datesUtils';
import StatusBadge from '../bookings/StatusBadge';
import PartnerAccessRequired from './PartnerAccessRequired';
import styles from './partnerPortal.module.scss';

const slotLabel = ({ startsAt, endsAt }: { startsAt: string; endsAt: string }) =>
    `${formatTimestampDate(startsAt)} · ${formatSlotRange(startsAt, endsAt)}`;

const OrderCard: React.FC<{ order: PartnerOrderSummary }> = ({ order }) => (
    <li>
        <Link
            className={`card ${styles.queueCard}`}
            to={ROUTES.partnerOrder(order.id)}
        >
            <div className={styles.queueCardHead}>
                <div>
                    <p className={styles.queueCardReference}>
                        {PARTNER_PORTAL_COPY.orderPrefix}
                        {order.reference}
                    </p>
                    <h2 className={styles.queueCardCustomer}>{order.recipient.name}</h2>
                </div>
                <StatusBadge status={order.status} />
            </div>

            <p className={styles.queueCardPartner}>{order.partner.name}</p>

            <dl className={styles.queueFacts}>
                <div>
                    <dt>
                        <Icon
                            name="pin"
                            size={ICON_SIZE.sm}
                        />
                        {PARTNER_PORTAL_COPY.area}
                    </dt>
                    <dd>{order.recipient.pincode}</dd>
                </div>
                <div>
                    <dt>
                        <Icon
                            name="box"
                            size={ICON_SIZE.sm}
                        />
                        {PARTNER_PORTAL_COPY.load}
                    </dt>
                    <dd>
                        {order.itemCount} {PARTNER_PORTAL_COPY.itemsSuffix}
                    </dd>
                </div>
                <div>
                    <dt>
                        <Icon
                            name="calendar"
                            size={ICON_SIZE.sm}
                        />
                        {PARTNER_PORTAL_COPY.pickup}
                    </dt>
                    <dd>{slotLabel(order.pickup)}</dd>
                </div>
                <div>
                    <dt>
                        <Icon
                            name="truck"
                            size={ICON_SIZE.sm}
                        />
                        {PARTNER_PORTAL_COPY.delivery}
                    </dt>
                    <dd>{slotLabel(order.delivery)}</dd>
                </div>
            </dl>

            <footer className={styles.queueCardFooter}>
                <p>
                    {PARTNER_PORTAL_COPY.latestUpdate}:{' '}
                    <strong>{PARTNER_EVENT_LABELS[order.latestEvent.type]}</strong>
                    <span>{formatEventTime(order.latestEvent.occurredAt)}</span>
                </p>
                <p className={styles.queueCardTotal}>
                    <Money value={order.total} />
                    <Icon
                        name="chevron-right"
                        size={ICON_SIZE.md}
                    />
                </p>
            </footer>
        </Link>
    </li>
);

const EmptyQueue = () => (
    <section className={`card ${styles.emptyState}`}>
        <Icon name="receipt" />
        <h2>{PARTNER_PORTAL_COPY.emptyTitle}</h2>
        <p>{PARTNER_PORTAL_COPY.emptyBody}</p>
    </section>
);

const PartnerOrdersPage: React.FC = () => {
    const [filter, setFilter] = useState<PartnerOrderFilter>('all');
    const orders = usePartnerOrders(filter);

    return (
        <div className={styles.portalPage}>
            <div className={styles.portalInner}>
                <header className={styles.settingsHead}>
                    <div className={styles.portalHead}>
                        <p className="eyebrow">{PARTNER_PORTAL_COPY.eyebrow}</p>
                        <h1>{PARTNER_PORTAL_COPY.queueTitle}</h1>
                        <p>{PARTNER_PORTAL_COPY.queueIntro}</p>
                    </div>
                    <nav
                        className={styles.portalActions}
                        aria-label={PARTNER_PORTAL_COPY.portalNavigation}
                    >
                        <Link
                            className={`button ${styles.secondaryAction}`}
                            to={ROUTES.partnerCatalog}
                        >
                            {PARTNER_PORTAL_COPY.catalogLink}
                        </Link>
                        <Link
                            className={`button ${styles.secondaryAction}`}
                            to={ROUTES.partnerSettings}
                        >
                            {PARTNER_PORTAL_COPY.settingsLink}
                        </Link>
                    </nav>
                </header>

                {orders.error?.code === 'FORBIDDEN' ? (
                    <PartnerAccessRequired />
                ) : (
                    <>
                        <div className={styles.queueControls}>
                            <label htmlFor="partner-order-filter">
                                {PARTNER_PORTAL_COPY.filterLabel}
                            </label>
                            <select
                                id="partner-order-filter"
                                value={filter}
                                onChange={(event) =>
                                    setFilter(event.target.value as PartnerOrderFilter)
                                }
                            >
                                {PARTNER_ORDER_FILTERS.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {orders.summary && (
                            <section
                                className={styles.operationsSummary}
                                aria-label={PARTNER_PORTAL_COPY.summaryLabel}
                            >
                                {[
                                    [PARTNER_PORTAL_COPY.activeOrders, orders.summary.activeOrders],
                                    [
                                        PARTNER_PORTAL_COPY.awaitingConfirmation,
                                        orders.summary.awaitingConfirmation,
                                    ],
                                    [PARTNER_PORTAL_COPY.pickupsToday, orders.summary.pickupsToday],
                                    [
                                        PARTNER_PORTAL_COPY.deliveriesToday,
                                        orders.summary.deliveriesToday,
                                    ],
                                    [
                                        PARTNER_PORTAL_COPY.completedToday,
                                        orders.summary.completedToday,
                                    ],
                                ].map(([label, value]) => (
                                    <div
                                        className="card"
                                        key={label}
                                    >
                                        <strong>{value}</strong>
                                        <span>{label}</span>
                                    </div>
                                ))}
                            </section>
                        )}

                        <AsyncBoundary
                            state={orders}
                            label={PARTNER_PORTAL_COPY.loadingQueue}
                            isEmpty={(loadedOrders) => loadedOrders.length === 0}
                            empty={<EmptyQueue />}
                        >
                            {(loadedOrders) => (
                                <>
                                    <p
                                        className={styles.queueCount}
                                        aria-live="polite"
                                    >
                                        {loadedOrders.length} {PARTNER_PORTAL_COPY.loadedSuffix}
                                    </p>
                                    <ul className={styles.queueList}>
                                        {loadedOrders.map((order) => (
                                            <OrderCard
                                                key={order.id}
                                                order={order}
                                            />
                                        ))}
                                    </ul>

                                    {orders.loadMoreError && (
                                        <div
                                            className={styles.loadMoreError}
                                            role="alert"
                                        >
                                            <p>{orders.loadMoreError.message}</p>
                                            <button
                                                className="button"
                                                type="button"
                                                onClick={() => void orders.loadMore()}
                                            >
                                                {API_COPY.retry}
                                            </button>
                                        </div>
                                    )}

                                    {orders.nextCursor && !orders.loadMoreError && (
                                        <button
                                            className={`button ${styles.loadMore}`}
                                            type="button"
                                            onClick={() => void orders.loadMore()}
                                            disabled={orders.isLoadingMore}
                                        >
                                            {orders.isLoadingMore
                                                ? PARTNER_PORTAL_COPY.loadingMore
                                                : PARTNER_PORTAL_COPY.loadMore}
                                        </button>
                                    )}
                                </>
                            )}
                        </AsyncBoundary>
                    </>
                )}
            </div>
        </div>
    );
};

export default PartnerOrdersPage;
