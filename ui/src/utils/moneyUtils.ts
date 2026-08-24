import { Money } from '../models/moneyModels';
import { CURRENCY } from '../config/brandConfig';

/**
 * Paise to a display string: whole rupees drop the decimals ("1,999"), anything
 * with paise keeps both places ("3.60") rather than showing a lone digit.
 */
export const formatAmount = ({ amount }: Money) => {
    const hasPaise = amount % 100 !== 0;

    return (amount / 100).toLocaleString(CURRENCY.locale, {
        minimumFractionDigits: hasPaise ? 2 : 0,
        maximumFractionDigits: hasPaise ? 2 : 0,
    });
};
