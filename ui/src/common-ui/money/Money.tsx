import React from 'react';
import { CURRENCY } from '../../config/brandConfig';
import { Money as MoneyValue } from '../../models/moneyModels';
import { formatAmount } from '../../utils/moneyUtils';

interface MoneyProps {
    value: MoneyValue;
    /** Renders a muted "/piece" style suffix after the amount. */
    unit?: string;
}

/** Single place the currency symbol and amount formatting live. */
const Money: React.FC<MoneyProps> = ({ value, unit }) => (
    <>
        {CURRENCY.symbol}
        {formatAmount(value)}
        {unit && <em>/{unit}</em>}
    </>
);

export default Money;
