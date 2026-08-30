export interface Address {
    /** Who receives the delivery, not necessarily the account holder. */
    recipientName: string;
    phone: string;
    building: string;
    street: string;
    landmark: string;
    pincode: string;
}

export interface SlotSelection {
    /** ISO date string, e.g. 2026-07-22, in the partner's timezone. */
    date: string;
    /** The server's slot id, which is what an order will be placed against. */
    slotId: string;
    /** ISO 8601 UTC instant; what two slots are ordered by. */
    startsAt: string;
}

export interface Booking {
    serviceIds: string[];
    address: Address;
    pickup: SlotSelection;
    delivery: SlotSelection;
}

export const EMPTY_SLOT: SlotSelection = { date: '', slotId: '', startsAt: '' };

export const emptyAddress = (pincode: string): Address => ({
    recipientName: '',
    phone: '',
    building: '',
    street: '',
    landmark: '',
    pincode,
});
