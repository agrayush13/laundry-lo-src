import React from 'react';
import { Link } from 'react-router-dom';
import BackLink from '../../common-ui/back-link/BackLink';
import Card from '../../common-ui/card/Card';
import Icon from '../../common-ui/icons/Icon';
import Money from '../../common-ui/money/Money';
import OrderTotals from '../../common-ui/order-totals/OrderTotals';
import QuantityStepper from '../../common-ui/quantity-stepper/QuantityStepper';
import { ICON_SIZE } from '../../config/brandConfig';
import { CART_COPY, PLUS_COPY } from '../../config/cartConfig';
import { MEMBERSHIP_SECTION } from '../../config/membershipConfig';
import { ROUTES } from '../../config/navigationConfig';
import { serviceNameFor } from '../../data/menu';
import { useCheckout } from '../../hooks/useCheckout';
import { multiplyMoney } from '../../models/moneyModels';
import styles from './cartPage.module.scss';

const CartPage: React.FC = () => {
    const {
        partner,
        lines,
        itemCount,
        subtotal,
        taxes,
        total,
        isEmpty,
        canCheckout,
        hasPlus,
        hasServices,
        setPlus,
        setQuantity,
        clear,
        placeOrder,
    } = useCheckout();

    if (isEmpty) {
        return (
            <div className={`${styles.cart} ${styles.cartEmpty}`}>
                <h1 className={styles.cartTitle}>{CART_COPY.title}</h1>
                <p className={styles.cartEmpty}>{CART_COPY.empty}</p>
                <Link
                    className="button button--primary"
                    to={ROUTES.laundries}
                >
                    {CART_COPY.browse}
                </Link>
            </div>
        );
    }

    return (
        <div className={styles.cart}>
            <div className={styles.cartInner}>
                <BackLink
                    label={CART_COPY.back}
                    to={partner ? ROUTES.laundry(partner.id) : ROUTES.laundries}
                />

                <h1 className={styles.cartTitle}>{CART_COPY.title}</h1>
                {partner && (
                    <p className={styles.cartSubtitle}>
                        {itemCount} {itemCount === 1 ? 'item' : 'items'} {CART_COPY.fromPrefix}{' '}
                        <strong>{partner.name}</strong>
                    </p>
                )}

                <ul className={styles.cartLines}>
                    {lines.map(({ item, quantity }) => (
                        <Card
                            as="li"
                            className={styles.cartLine}
                            key={item.id}
                        >
                            <span
                                className={styles.cartLineIcon}
                                aria-hidden="true"
                            >
                                <Icon
                                    name={item.iconKey}
                                    size={ICON_SIZE.xl}
                                />
                            </span>
                            <div className={styles.cartLineBody}>
                                <h2 className={styles.cartLineName}>{item.name}</h2>
                                <p className={styles.cartLineService}>{serviceNameFor(item.id)}</p>
                                <p className={styles.cartLinePrice}>
                                    <Money value={item.price} /> {CART_COPY.perPrefix} {item.unit}
                                </p>
                            </div>

                            <QuantityStepper
                                label={`${item.name}, ${serviceNameFor(item.id)}`}

                                quantity={quantity}

                                size="sm"

                                onChange={(next) => partner && setQuantity(partner.id, item, next)}
                            />

                            <p className={styles.cartLineAmount}>
                                <Money value={multiplyMoney(item.price, quantity)} />
                            </p>

                            <button
                                className={styles.cartLineRemove}
                                type="button"
                                aria-label={`Remove ${item.name}, ${serviceNameFor(item.id)}`}
                                onClick={() => partner && setQuantity(partner.id, item, 0)}
                            >
                                <Icon
                                    name="trash"
                                    size={ICON_SIZE.md}
                                />
                            </button>
                        </Card>
                    ))}

                    {hasPlus && (
                        <Card
                            as="li"
                            className={styles.cartLine}
                        >
                            <span
                                className={styles.cartLineIcon}
                                aria-hidden="true"
                            >
                                <Icon
                                    name="crown"
                                    size={ICON_SIZE.xl}
                                />
                            </span>
                            <div className={styles.cartLineBody}>
                                <h2 className={styles.cartLineName}>{PLUS_COPY.cartLabel}</h2>
                                <p className={styles.cartLinePrice}>{PLUS_COPY.cartSublabel}</p>
                            </div>
                            <p className={styles.cartLineAmount}>
                                <Money value={MEMBERSHIP_SECTION.card.price} />
                            </p>
                            <button
                                className={styles.cartLineRemove}
                                type="button"
                                aria-label={PLUS_COPY.remove}
                                onClick={() => setPlus(false)}
                            >
                                <Icon
                                    name="trash"
                                    size={ICON_SIZE.md}
                                />
                            </button>
                        </Card>
                    )}
                </ul>

                <section className={`card ${styles.cartSummary}`}>
                    <h2 className={styles.cartSummaryTitle}>{CART_COPY.summaryTitle}</h2>
                    <OrderTotals
                        subtotal={subtotal}
                        taxes={taxes}
                        total={total}
                    />

                    <button
                        className={`button button--primary ${styles.cartPlace}`}
                        type="button"
                        disabled={!canCheckout}
                        onClick={placeOrder}
                    >
                        {CART_COPY.place}
                    </button>

                    {!hasServices && hasPlus && (
                        <Link
                            className={styles.cartAddServices}
                            to={ROUTES.laundries}
                        >
                            {PLUS_COPY.browse}
                        </Link>
                    )}
                    <button
                        className={styles.cartClear}
                        type="button"
                        onClick={clear}
                    >
                        {CART_COPY.clear}
                    </button>
                </section>
            </div>
        </div>
    );
};

export default CartPage;
