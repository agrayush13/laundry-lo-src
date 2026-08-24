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
    /** ISO date string, e.g. 2026-07-22. */
    date: string;
    slot: string;
}

export interface Booking {
    serviceIds: string[];
    address: Address;
    pickup: SlotSelection;
    delivery: SlotSelection;
}

export const EMPTY_SLOT: SlotSelection = { date: '', slot: '' };

export const emptyAddress = (pincode: string): Address => ({
    recipientName: '',
    phone: '',
    building: '',
    street: '',
    landmark: '',
    pincode,
});
