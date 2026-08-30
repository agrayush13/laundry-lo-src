import { PriceUnit } from '../models/catalogModels';
import { Money, addMoney, multiplyMoney, rupees } from '../models/moneyModels';
import { TAX_RATE } from '../config/cartConfig';

/** Lowercase slugs, not display strings; labels live in ordersConfig. */
export type OrderStatus = 'processing' | 'out_for_delivery' | 'delivered' | 'cancelled';

/**
 * Events that happened, not presentation. The client derives labels and
 * done/current/pending from these plus the known sequence, so copy changes
 * never need a backend deploy.
 */
export type OrderEventType =
    | 'placed'
    | 'confirmed'
    | 'picked_up'
    | 'in_progress'
    | 'out_for_delivery'
    | 'delivered'
    | 'cancelled';

export interface OrderEvent {
    type: OrderEventType;
    occurredAt: string;
}

export interface OrderLine {
    itemId: string;
    name: string;
    quantity: number;
    unit: PriceUnit;
    amount: Money;
}

export interface OrderTotals {
    subtotal: Money;
    delivery: Money;
    tax: Money;
    total: Money;
}

export interface OrderAddress {
    label: string;
    building: string;
    street: string;
    pincode: string;
}

export interface Order {
    /** Opaque and non-guessable; every lookup uses this. */
    id: string;
    /** Human-friendly, display only. Never looked up by. */
    reference: string;
    status: OrderStatus;
    placedAt: string;
    partner: { id: string; name: string };
    lines: OrderLine[];
    totals: OrderTotals;
    deliveryAddress: OrderAddress;
    events: OrderEvent[];
}

// Matches the account's saved Home address, and sits in a pincode the seeded
// partners actually serve: these orders are all with Bengaluru laundries.
const HOME: OrderAddress = {
    label: 'Home',
    building: '42',
    street: 'Sector 5, HSR Layout, Bengaluru',
    pincode: '560103',
};

const totalsFor = (subtotal: Money): OrderTotals => {
    const delivery = rupees(0);
    const tax = multiplyMoney(subtotal, TAX_RATE);
    return {
        subtotal,
        delivery,
        tax,
        total: addMoney(subtotal, delivery, tax),
    };
};

export const ORDERS: Order[] = [
    {
        id: 'ord_01J8XR3K2WQ4',
        reference: 'LL-2026-001',
        status: 'processing',
        placedAt: '2026-08-20T05:00:00Z',
        partner: { id: '1001', name: 'SparkleWash Express' },
        lines: [
            {
                itemId: 'wf-shirt',
                name: 'Shirt / T-shirt',
                quantity: 5,
                unit: 'piece',
                amount: rupees(100),
            },
            {
                itemId: 'dc-jacket',
                name: 'Jacket / Coat',
                quantity: 2,
                unit: 'piece',
                amount: rupees(398),
            },
        ],
        totals: totalsFor(rupees(498)),
        deliveryAddress: HOME,
        events: [
            { type: 'placed', occurredAt: '2026-08-20T05:00:00Z' },
            { type: 'confirmed', occurredAt: '2026-08-20T05:15:00Z' },
            { type: 'picked_up', occurredAt: '2026-08-20T08:30:00Z' },
        ],
    },
    {
        id: 'ord_01J8XR7M5BD9',
        reference: 'LL-2026-002',
        status: 'out_for_delivery',
        placedAt: '2026-08-19T06:20:00Z',
        partner: { id: '1003', name: 'Royal Dry Cleaners' },
        lines: [
            {
                itemId: 'dc-saree',
                name: 'Saree',
                quantity: 3,
                unit: 'piece',
                amount: rupees(747),
            },
            {
                itemId: 'sp-stain',
                name: 'Stain Removal',
                quantity: 1,
                unit: 'piece',
                amount: rupees(99),
            },
        ],
        totals: totalsFor(rupees(846)),
        deliveryAddress: HOME,
        events: [
            { type: 'placed', occurredAt: '2026-08-19T06:20:00Z' },
            { type: 'confirmed', occurredAt: '2026-08-19T06:40:00Z' },
            { type: 'picked_up', occurredAt: '2026-08-19T10:00:00Z' },
            { type: 'in_progress', occurredAt: '2026-08-20T07:30:00Z' },
            { type: 'out_for_delivery', occurredAt: '2026-08-21T03:30:00Z' },
        ],
    },
    {
        id: 'ord_01J8XRB1N4TC',
        reference: 'LL-2026-003',
        status: 'delivered',
        placedAt: '2026-08-15T05:30:00Z',
        partner: { id: '1002', name: 'CleanFold Laundry' },
        lines: [
            {
                itemId: 'wf-shirt',
                name: 'Shirt / T-shirt',
                quantity: 8,
                unit: 'piece',
                amount: rupees(160),
            },
        ],
        totals: totalsFor(rupees(160)),
        deliveryAddress: HOME,
        events: [
            { type: 'placed', occurredAt: '2026-08-15T05:30:00Z' },
            { type: 'confirmed', occurredAt: '2026-08-15T05:50:00Z' },
            { type: 'picked_up', occurredAt: '2026-08-15T09:30:00Z' },
            { type: 'in_progress', occurredAt: '2026-08-16T07:30:00Z' },
            { type: 'out_for_delivery', occurredAt: '2026-08-17T03:30:00Z' },
            { type: 'delivered', occurredAt: '2026-08-17T12:10:00Z' },
        ],
    },
];

export const itemCount = (order: Order) =>
    order.lines.reduce((sum, line) => sum + line.quantity, 0);

export const getOrder = (id: string) => ORDERS.find((order) => order.id === id);
