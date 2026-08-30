import type { PriceUnit } from '../models.js';

/** Money crosses the wire as integer minor units plus a currency, never a float. */
export interface Money {
    amount: number;
    currency: string;
}

export const money = (amount: number, currency = 'INR'): Money => ({ amount, currency });

export const moneyWithUnit = (
    amount: number,
    unit: PriceUnit,
    currency = 'INR'
): Money & { unit: PriceUnit } => ({ amount, currency, unit });
