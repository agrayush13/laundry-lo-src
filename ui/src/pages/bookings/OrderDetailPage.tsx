import React from 'react';
import { Navigate } from 'react-router-dom';
import AsyncBoundary from '../../common-ui/async-boundary/AsyncBoundary';
import BackLink from '../../common-ui/back-link/BackLink';
import ComingSoonButton from '../../common-ui/coming-soon-button/ComingSoonButton';
import Icon from '../../common-ui/icons/Icon';
import Money from '../../common-ui/money/Money';
import { BRAND, ICON_SIZE } from '../../config/brandConfig';
import { ORDERS_COPY } from '../../config/cartConfig';
import { ROUTES } from '../../config/navigationConfig';
import { useOrder } from '../../hooks/useOrder';
import { formatEventTime, formatSlotRange, formatTimestampDate } from '../../utils/datesUtils';
import { buildTimeline, formatOrderAddress } from '../../utils/ordersUtils';
import SlotPicker from '../checkout/SlotPicker';
import StatusBadge from './StatusBadge';
import styles from './bookings.module.scss';

const OrderDetailPage: React.FC = () => {
    const state = useOrder();
    const availableScheduleStarts = (state.scheduleDays ?? []).flatMap((day) =>
        day.slots.filter((slot) => slot.available).map((slot) => slot.startsAt)
    );
    const hasReschedulingPair = availableScheduleStarts.some((pickupStartsAt) =>
        availableScheduleStarts.some(
            (deliveryStartsAt) => Date.parse(deliveryStartsAt) > Date.parse(pickupStartsAt)
        )
    );

    if (state.error?.code === 'NOT_FOUND') {
        return (
            <Navigate
                to={ROUTES.bookings}
                replace
            />
        );
    }

    return (
        <AsyncBoundary
            state={state}
            label="Loading order"
        >
            {(order) => (
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
                                    <span className={styles.orderPartner}>
                                        {order.partner.name}
                                    </span>
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
                            <h2 className={styles.orderHeading}>{ORDERS_COPY.scheduleTitle}</h2>
                            <dl className={styles.orderSchedule}>
                                <div>
                                    <dt>{ORDERS_COPY.pickup}</dt>
                                    <dd>
                                        {formatTimestampDate(order.pickup.startsAt)} ·{' '}
                                        {formatSlotRange(
                                            order.pickup.startsAt,
                                            order.pickup.endsAt
                                        )}
                                    </dd>
                                </div>
                                <div>
                                    <dt>{ORDERS_COPY.delivery}</dt>
                                    <dd>
                                        {formatTimestampDate(order.delivery.startsAt)} ·{' '}
                                        {formatSlotRange(
                                            order.delivery.startsAt,
                                            order.delivery.endsAt
                                        )}
                                    </dd>
                                </div>
                            </dl>
                            {order.reschedules.length > 0 && (
                                <p className={styles.scheduleChanged}>
                                    {ORDERS_COPY.scheduleChanged}:{' '}
                                    {formatEventTime(
                                        order.reschedules[order.reschedules.length - 1]!.occurredAt
                                    )}
                                </p>
                            )}
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
                            <address className={styles.orderAddress}>
                                {formatOrderAddress(order)}
                            </address>
                        </section>

                        {order.canCancel && (
                            <section className={`card ${styles.orderCancellation}`}>
                                <h2 className={styles.orderHeading}>
                                    {ORDERS_COPY.cancellationTitle}
                                </h2>
                                <p>{ORDERS_COPY.cancellationPolicy}</p>
                                {!state.isConfirmingCancellation ? (
                                    <button
                                        className={`button ${styles.dangerButton}`}
                                        type="button"
                                        onClick={state.requestCancellation}
                                    >
                                        {ORDERS_COPY.cancelOrder}
                                    </button>
                                ) : (
                                    <div
                                        className={styles.cancellationConfirmation}
                                        role="alertdialog"
                                        aria-labelledby="customer-cancellation-title"
                                        aria-describedby="customer-cancellation-body"
                                    >
                                        <h3 id="customer-cancellation-title">
                                            {ORDERS_COPY.cancellationConfirmationTitle}
                                        </h3>
                                        <p id="customer-cancellation-body">
                                            {ORDERS_COPY.cancellationConfirmationBody}
                                        </p>
                                        <div>
                                            <button
                                                className="button"
                                                type="button"
                                                onClick={state.keepOrder}
                                                disabled={state.isCancelling}
                                                autoFocus
                                            >
                                                {ORDERS_COPY.keepOrder}
                                            </button>
                                            <button
                                                className={`button ${styles.dangerButton}`}
                                                type="button"
                                                onClick={() => void state.submitCancellation()}
                                                disabled={state.isCancelling}
                                            >
                                                {state.isCancelling
                                                    ? ORDERS_COPY.cancelling
                                                    : ORDERS_COPY.confirmCancellation}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {state.cancellationError && (
                                    <p
                                        className={styles.cancellationError}
                                        role="alert"
                                    >
                                        {state.cancellationError}
                                    </p>
                                )}
                            </section>
                        )}

                        {order.canReschedule && (
                            <section className={`card ${styles.orderRescheduling}`}>
                                <h2 className={styles.orderHeading}>
                                    {ORDERS_COPY.reschedulingTitle}
                                </h2>
                                <p>{ORDERS_COPY.reschedulingPolicy}</p>
                                {!state.isChangingSchedule ? (
                                    <button
                                        className="button"
                                        type="button"
                                        onClick={state.requestRescheduling}
                                    >
                                        {ORDERS_COPY.changeSchedule}
                                    </button>
                                ) : (
                                    <div className={styles.reschedulingForm}>
                                        {state.isLoadingSchedule && (
                                            <p role="status">{ORDERS_COPY.loadingSchedule}</p>
                                        )}
                                        {state.scheduleDays && !hasReschedulingPair && (
                                            <p>{ORDERS_COPY.noReschedulingSlots}</p>
                                        )}
                                        {state.scheduleDays && hasReschedulingPair && (
                                            <>
                                                <SlotPicker
                                                    index={1}
                                                    title={ORDERS_COPY.choosePickup}
                                                    days={state.scheduleDays}
                                                    value={state.pickup}
                                                    onChange={state.selectPickup}
                                                />
                                                <SlotPicker
                                                    index={2}
                                                    title={ORDERS_COPY.chooseDelivery}
                                                    days={state.scheduleDays}
                                                    value={state.delivery}
                                                    min={state.pickup}
                                                    onChange={state.selectDelivery}
                                                />
                                            </>
                                        )}
                                        {state.scheduleError && (
                                            <p
                                                className={styles.cancellationError}
                                                role="alert"
                                            >
                                                {state.scheduleError}
                                            </p>
                                        )}
                                        <div className={styles.reschedulingActions}>
                                            <button
                                                className="button"
                                                type="button"
                                                onClick={state.cancelRescheduling}
                                                disabled={state.isSubmittingSchedule}
                                            >
                                                {ORDERS_COPY.keepSchedule}
                                            </button>
                                            {state.scheduleDays === null &&
                                                !state.isLoadingSchedule && (
                                                    <button
                                                        className="button"
                                                        type="button"
                                                        onClick={() => void state.retrySchedule()}
                                                    >
                                                        {ORDERS_COPY.retrySchedule}
                                                    </button>
                                                )}
                                            {state.scheduleDays && hasReschedulingPair && (
                                                <button
                                                    className="button"
                                                    type="button"
                                                    onClick={() => void state.submitRescheduling()}
                                                    disabled={state.isSubmittingSchedule}
                                                >
                                                    {state.isSubmittingSchedule
                                                        ? ORDERS_COPY.savingSchedule
                                                        : ORDERS_COPY.saveSchedule}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </section>
                        )}

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
            )}
        </AsyncBoundary>
    );
};

export default OrderDetailPage;
