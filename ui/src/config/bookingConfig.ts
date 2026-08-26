import { Address } from '../models/bookingModels';

export interface AddressFieldConfig {
    name: keyof Address;
    label: string;
    placeholder: string;
    half?: boolean;
    inputMode?: 'numeric' | 'tel';
    maxLength?: number;
    optional?: boolean;
}

export const PIN_CODE_LENGTH = 6;

/**
 * Where the listing starts when a visitor arrives without a pin code, which the
 * journey's service cards do. Coverage is not modelled yet, so this is a real
 * seeded pin rather than a guess at the visitor's own.
 */
export const DEFAULT_PIN_CODE = '560103';
export const SCHEDULE_DAYS = 7;

export const ADDRESS_FIELDS: AddressFieldConfig[] = [
    { name: 'recipientName', label: 'Full Name', placeholder: 'John Doe', half: true },
    {
        name: 'phone',
        label: 'Phone Number',
        placeholder: '+91 98765 43210',
        half: true,
        inputMode: 'tel',
    },
    {
        name: 'building',
        label: 'Flat / House No. / Building',
        placeholder: 'e.g. Flat 402, Tower B',
    },
    { name: 'street', label: 'Street / Area / Colony', placeholder: 'e.g. MG Road, Sector 5' },
    {
        name: 'landmark',
        label: 'Landmark (Optional)',
        placeholder: 'e.g. Near City Mall',
        half: true,
        optional: true,
    },
    {
        name: 'pincode',
        label: 'Pincode',
        placeholder: '560103',
        half: true,
        inputMode: 'numeric',
        maxLength: PIN_CODE_LENGTH,
    },
];

export const ADDRESS_PICKER_COPY = {
    legend: 'Choose a pickup address',
    savedHeading: 'Saved addresses',
    addNew: 'Add a new address',
    addNewHint: 'Use a different address for this order',
    newAddressHeading: 'New address',
} as const;

export const CHECKOUT_COPY = {
    back: 'Back to cart',
    title: 'Checkout',
    subtitle: 'A few details and your pickup is booked',
    addressHeading: 'Pickup Address',
    addressSubtitle: 'Where should we pick up your clothes?',
    scheduleHeading: 'Schedule Pickup & Delivery',
    scheduleSubtitle: 'Select your preferred date and time',
    summaryHeading: 'Order Summary',
    orderingFrom: 'Ordering from',
    sameAddressNote: 'Delivery will be at the same address',
    paymentNote: 'Payment will be collected at pickup',
    pickupLabel: 'Pickup',
    deliveryLabel: 'Delivery',
    selectDate: 'Select Date',
    selectSlot: 'Select Time Slot',
    confirm: 'Confirm Booking',
} as const;

/** Shown beneath a field once the customer has tried to submit without it. */
export const VALIDATION_COPY = {
    recipientName: 'Enter the name we should ask for at pickup.',
    phone: 'Enter a phone number our driver can reach.',
    building: 'Enter your flat, house number or building.',
    street: 'Enter your street or area.',
    pincode: 'Enter a 6-digit pincode.',
    pickup: 'Choose a pickup date and time.',
    delivery: 'Choose a delivery date and time.',
    deliveryBeforePickup: 'Delivery must be after pickup.',
} as const;

export const CONFIRMATION_COPY = {
    title: 'Booking Confirmed!',
    body: "Your laundry pickup has been scheduled. You'll receive a confirmation SMS shortly.",
    orderPrefix: 'Order #',
    primary: 'Back to Home',
    secondary: 'Book Another Service',
} as const;
