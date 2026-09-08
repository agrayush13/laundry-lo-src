import React from 'react';
import { Navigate } from 'react-router-dom';
import AsyncBoundary from '../../common-ui/async-boundary/AsyncBoundary';
import BackLink from '../../common-ui/back-link/BackLink';
import Icon from '../../common-ui/icons/Icon';
import Money from '../../common-ui/money/Money';
import { ICON_SIZE } from '../../config/brandConfig';
import { ROUTES } from '../../config/navigationConfig';
import { PARTNER_EVENT_LABELS, PARTNER_PORTAL_COPY } from '../../config/partnerOrdersConfig';
import { usePartnerOrder } from '../../hooks/usePartnerOrder';
import { formatEventTime, formatSlotRange, formatTimestampDate } from '../../utils/datesUtils';
import { buildTimeline } from '../../utils/ordersUtils';
import StatusBadge from '../bookings/StatusBadge';
import styles from './partnerPortal.module.scss';

const slotLabel = ({ startsAt, endsAt }: { startsAt: string; endsAt: string }) => (
    <>
        <strong>{formatTimestampDate(startsAt)}</strong>
        <span>{formatSlotRange(startsAt, endsAt)}</span>
    </>
);

const PartnerOrderDetailPage: React.FC = () => {
    const orderState = usePartnerOrder();

    if (orderState.error?.code === 'NOT_FOUND') {
        return (
            <Navigate
                to={ROUTES.partnerOrders}
                replace
            />
        );
    }

    return (
        <div className={styles.portalPage}>
            <div className={styles.detailInner}>
                <BackLink
                    label={PARTNER_PORTAL_COPY.backToQueue}
                    to={ROUTES.partnerOrders}
                    spacing="lg"
                />

                <AsyncBoundary
                    state={orderState}
                    label={PARTNER_PORTAL_COPY.loadingOrder}
                >
                    {(order) => {
                        const { action } = orderState;
                        const address = order.deliveryAddress;

                        return (
                            <>
                                <section className={`card ${styles.detailSummary}`}>
                                    <div>
                                        <p className={styles.detailLabel}>
                                            {PARTNER_PORTAL_COPY.orderPrefix}
                                        </p>
                                        <h1>{order.reference}</h1>
                                        <p>
                                            {order.partner.name} · {PARTNER_PORTAL_COPY.placed}{' '}
                                            {formatEventTime(order.placedAt)}
                                        </p>
                                    </div>
                                    <StatusBadge status={order.status} />
                                </section>

                                <div className={styles.detailGrid}>
                                    <section className={`card ${styles.detailCard}`}>
                                        <h2>{PARTNER_PORTAL_COPY.customer}</h2>
                                        <p className={styles.customerName}>
                                            {address.recipientName}
                                        </p>
                                        <a
                                            className={styles.customerPhone}
                                            href={`tel:${address.phone.replace(/[^+\d]/g, '')}`}
                                        >
                                            <Icon
                                                name="phone"
                                                size={ICON_SIZE.sm}
                                            />
                                            {address.phone}
                                        </a>
                                        <address>
                                            {address.building}, {address.street}
                                            {address.landmark && <>, {address.landmark}</>}
                                            <br />
                                            {address.pincode}
                                        </address>
                                    </section>

                                    <section className={`card ${styles.detailCard}`}>
                                        <h2>{PARTNER_PORTAL_COPY.schedule}</h2>
                                        <dl className={styles.scheduleList}>
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
                                    </section>
                                </div>

                                <section className={`card ${styles.detailCard}`}>
                                    <h2>{PARTNER_PORTAL_COPY.items}</h2>
                                    <ul className={styles.itemList}>
                                        {order.lines.map((line) => (
                                            <li key={line.itemId}>
                                                <span>
                                                    {line.name}
                                                    <em>
                                                        {line.quantity} × {line.unit}
                                                    </em>
                                                </span>
                                                <strong>
                                                    <Money value={line.amount} />
                                                </strong>
                                            </li>
                                        ))}
                                    </ul>
                                    <p className={styles.orderTotal}>
                                        <span>{PARTNER_PORTAL_COPY.total}</span>
                                        <strong>
                                            <Money value={order.totals.total} />
                                        </strong>
                                    </p>
                                </section>

                                <section className={`card ${styles.detailCard}`}>
                                    <h2>{PARTNER_PORTAL_COPY.progress}</h2>
                                    <ol className={styles.progressList}>
                                        {buildTimeline(order.events).map((entry) => (
                                            <li
                                                key={entry.label}
                                                data-state={entry.state}
                                            >
                                                <span aria-hidden="true" />
                                                <p>
                                                    <strong>{entry.label}</strong>
                                                    <small>{entry.detail}</small>
                                                </p>
                                            </li>
                                        ))}
                                    </ol>
                                </section>

                                <section className={`card ${styles.actionCard}`}>
                                    <h2>{PARTNER_PORTAL_COPY.nextStep}</h2>
                                    {action ? (
                                        <>
                                            <p>{PARTNER_PORTAL_COPY.confirmationWarning}</p>
                                            {!orderState.isConfirming ? (
                                                <button
                                                    className="button button--primary"
                                                    type="button"
                                                    onClick={orderState.requestConfirmation}
                                                >
                                                    {action.buttonLabel}
                                                </button>
                                            ) : (
                                                <div
                                                    className={styles.confirmation}
                                                    role="alertdialog"
                                                    aria-labelledby="partner-order-confirmation-title"
                                                    aria-describedby="partner-order-confirmation-body"
                                                >
                                                    <h3 id="partner-order-confirmation-title">
                                                        {action.confirmationTitle}
                                                    </h3>
                                                    <p id="partner-order-confirmation-body">
                                                        {action.confirmationBody}
                                                    </p>
                                                    <div>
                                                        <button
                                                            className="button"
                                                            type="button"
                                                            onClick={orderState.cancelConfirmation}
                                                            disabled={orderState.isUpdating}
                                                        >
                                                            {PARTNER_PORTAL_COPY.cancelConfirmation}
                                                        </button>
                                                        <button
                                                            className="button button--primary"
                                                            type="button"
                                                            onClick={() =>
                                                                void orderState.submitUpdate()
                                                            }
                                                            disabled={orderState.isUpdating}
                                                            autoFocus
                                                        >
                                                            {orderState.isUpdating
                                                                ? PARTNER_PORTAL_COPY.updating
                                                                : action.buttonLabel}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                            {orderState.updateError && (
                                                <p
                                                    className={styles.updateError}
                                                    role="alert"
                                                >
                                                    {orderState.updateError}
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <p>
                                            {order.status === 'cancelled'
                                                ? PARTNER_PORTAL_COPY.terminalCancelled
                                                : PARTNER_PORTAL_COPY.terminalDelivered}
                                        </p>
                                    )}
                                </section>

                                <p className={styles.latestUpdate}>
                                    {PARTNER_PORTAL_COPY.latestRecordedEvent}:{' '}
                                    <strong>
                                        {
                                            PARTNER_EVENT_LABELS[
                                                order.events[order.events.length - 1]?.type ??
                                                    'placed'
                                            ]
                                        }
                                    </strong>
                                </p>
                            </>
                        );
                    }}
                </AsyncBoundary>
            </div>
        </div>
    );
};

export default PartnerOrderDetailPage;
