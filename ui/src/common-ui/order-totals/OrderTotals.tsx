import React from 'react';
import { CURRENCY } from '../../config/brandConfig';
import { CART_COPY } from '../../config/cartConfig';
import { Money } from '../../models/moneyModels';
import { formatAmount } from '../../utils/moneyUtils';
import styles from './orderTotals.module.scss';

interface OrderTotalsProps {
    subtotal: Money;
    membership?: Money;
    discount?: Money;
    taxes: Money;
    total: Money;
}

/** Subtotal / delivery / taxes / total, with the grand total emphasised. */
const OrderTotals: React.FC<OrderTotalsProps> = ({
    subtotal,
    membership,
    discount,
    taxes,
    total,
}) => {
    const price = (value: Money) => `${CURRENCY.symbol}${formatAmount(value)}`;
    const rows = [
        { label: CART_COPY.subtotal, value: price(subtotal) },
        ...(membership && membership.amount > 0
            ? [{ label: CART_COPY.membership, value: price(membership) }]
            : []),
        ...(discount && discount.amount > 0
            ? [{ label: CART_COPY.discount, value: `-${price(discount)}` }]
            : []),
        { label: CART_COPY.delivery, value: CART_COPY.deliveryFree, isFree: true },
        { label: CART_COPY.taxes, value: price(taxes) },
        { label: CART_COPY.total, value: price(total) },
    ];

    return (
        <dl className={styles.orderTotals}>
            {rows.map(({ label, value, isFree }) => (
                <div key={label}>
                    <dt>{label}</dt>
                    <dd className={isFree ? styles.orderTotalsFree : undefined}>{value}</dd>
                </div>
            ))}
        </dl>
    );
};

export default OrderTotals;
