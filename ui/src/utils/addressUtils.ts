import { Address } from '../models/bookingModels';

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
