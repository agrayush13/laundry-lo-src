/**
 * Money is always integer minor units (paise) plus a currency, never a float.
 * Tax and discount arithmetic on floats drifts; this shape is what the API
 * contract sends and what the backend will store.
 */
export interface Money {
    amount: number;
    currency: 'INR';
}

/** Seed data and tests read better in rupees than in paise. */
export const rupees = (value: number): Money => ({
    amount: Math.round(value * 100),
    currency: 'INR',
});

export const addMoney = (...values: Money[]): Money => ({
    amount: values.reduce((sum, value) => sum + value.amount, 0),
    currency: 'INR',
});

export const multiplyMoney = ({ amount, currency }: Money, factor: number): Money => ({
    amount: Math.round(amount * factor),
    currency,
});

export const ZERO: Money = { amount: 0, currency: 'INR' };
