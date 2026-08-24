import React from 'react';
import { Navigate } from 'react-router-dom';
import BackLink from '../../common-ui/back-link/BackLink';
import Icon from '../../common-ui/icons/Icon';
import Money from '../../common-ui/money/Money';
import OrderTotals from '../../common-ui/order-totals/OrderTotals';
import { CHECKOUT_COPY } from '../../config/bookingConfig';
import { ICON_SIZE } from '../../config/brandConfig';
import { ROUTES } from '../../config/navigationConfig';
import { SCHEDULE_ANCHOR_ID, useCheckoutForm } from '../../hooks/useCheckoutForm';
import { multiplyMoney } from '../../models/moneyModels';
import AddressPicker from './AddressPicker';
import SlotPicker from './SlotPicker';
import styles from './checkout.module.scss';

const CheckoutPage: React.FC = () => {
    const {
        partner,
        lines,
        subtotal,
        taxes,
        total,
        savedAddresses,
        selectedAddressId,
        draftAddress,
        pickup,
        delivery,
        errors,
        isEmpty,
        selectAddress,
        updateDraftAddress,
        setPickup,
        setDelivery,
        confirm,
    } = useCheckoutForm();

    const scheduleError = errors.pickup ?? errors.delivery ?? errors.deliveryBeforePickup;

    if (isEmpty || !partner) {
        return (
            <Navigate
                to={ROUTES.cart}
                replace
            />
        );
    }

    return (
        <div className={styles.checkout}>
            <div className={styles.checkoutInner}>
                <BackLink
                    label={CHECKOUT_COPY.back}
                    to={ROUTES.cart}
                />

                <p className={styles.checkoutEyebrow}>{CHECKOUT_COPY.orderingFrom}</p>
                <h1 className={styles.checkoutTitle}>{partner.name}</h1>
                <p className={styles.checkoutSubtitle}>{CHECKOUT_COPY.subtitle}</p>

                <section className={styles.checkoutSection}>
                    <h2 className={styles.checkoutHeading}>{CHECKOUT_COPY.addressHeading}</h2>
                    <p className={styles.checkoutHint}>{CHECKOUT_COPY.addressSubtitle}</p>
                    <AddressPicker
                        savedAddresses={savedAddresses}
                        selectedId={selectedAddressId}
                        draft={draftAddress}
                        errors={errors}
                        onSelect={selectAddress}
                        onDraftChange={updateDraftAddress}
                    />
                </section>

                <section
                    className={styles.checkoutSection}
                    id={SCHEDULE_ANCHOR_ID}
                >
                    <h2 className={styles.checkoutHeading}>{CHECKOUT_COPY.scheduleHeading}</h2>
                    <p className={styles.checkoutHint}>{CHECKOUT_COPY.scheduleSubtitle}</p>
                    {scheduleError && (
                        <p
                            className={styles.checkoutError}
                            role="alert"
                        >
                            {scheduleError}
                        </p>
                    )}
                    <div className={styles.schedule}>
                        <SlotPicker
                            index={1}
                            title={CHECKOUT_COPY.pickupLabel}
                            value={pickup}
                            onChange={setPickup}
                        />
                        <SlotPicker
                            index={2}
                            title={CHECKOUT_COPY.deliveryLabel}
                            value={delivery}
                            minDate={pickup.date}
                            minSlot={pickup.slot}
                            onChange={setDelivery}
                        />
                    </div>
                </section>

                <section className={styles.checkoutSection}>
                    <h2 className={styles.checkoutHeading}>{CHECKOUT_COPY.summaryHeading}</h2>
                    <div className={`card ${styles.checkoutSummary}`}>
                        <ul className={styles.checkoutLines}>
                            {lines.map(({ item, quantity }) => (
                                <li key={item.id}>
                                    <span>
                                        {item.name} ×{quantity}
                                    </span>
                                    <strong>
                                        <Money value={multiplyMoney(item.price, quantity)} />
                                    </strong>
                                </li>
                            ))}
                        </ul>
                        <OrderTotals
                            subtotal={subtotal}
                            taxes={taxes}
                            total={total}
                        />
                    </div>
                </section>

                <p className={styles.checkoutNote}>
                    <Icon
                        name="check-circle"
                        size={ICON_SIZE.sm}
                    />
                    {CHECKOUT_COPY.paymentNote}
                </p>

                <button
                    className={`button button--primary ${styles.checkoutConfirm}`}
                    type="button"
                    onClick={confirm}
                >
                    {CHECKOUT_COPY.confirm}
                    <Icon
                        name="arrow-right"
                        size={ICON_SIZE.md}
                    />
                </button>
            </div>
        </div>
    );
};

export default CheckoutPage;
