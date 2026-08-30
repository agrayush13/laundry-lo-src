import { Address } from '../models/bookingModels';

export const addressFieldId = (prefix: string, field: keyof Address) => `${prefix}-${field}`;

/** Indian pincodes are six ASCII digits; length alone accepts values like abcdef. */
export const isValidPinCode = (value: string) => /^[0-9]{6}$/.test(value);

/**
 * Keep formatting characters for display, but require a plausible dialable
 * number. Ten digits covers a local Indian mobile; fifteen is E.164's ceiling.
 */
export const isValidPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15;
};

/** Collapses an address into the non-empty lines shown on a summary. */
export const toAddressLines = ({
    recipientName,
    building,
    street,
    landmark,
    pincode,
    phone,
}: Address) =>
    [recipientName, [building, street, landmark].filter(Boolean).join(', '), pincode, phone].filter(
        Boolean
    );

/** Single-line rendering of an address, for lists and summaries. */
export const formatAddress = ({ building, street, landmark, pincode }: Address) =>
    [building, street, landmark, pincode].filter(Boolean).join(', ');
