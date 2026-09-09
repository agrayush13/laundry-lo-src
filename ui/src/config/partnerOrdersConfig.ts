import type { PartnerOrderEventType } from '../models/partnerOrderModels';
import type { OrderEventType, OrderStatus } from '../data/orders';

export type PartnerOrderFilter = 'all' | OrderStatus;

export const PARTNER_ORDER_FILTERS: Array<{ value: PartnerOrderFilter; label: string }> = [
    { value: 'all', label: 'All orders' },
    { value: 'processing', label: 'Processing' },
    { value: 'out_for_delivery', label: 'Out for delivery' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
];

export const PARTNER_EVENT_LABELS: Record<OrderEventType, string> = {
    placed: 'Order placed',
    confirmed: 'Order confirmed',
    picked_up: 'Pickup completed',
    in_progress: 'Cleaning in progress',
    out_for_delivery: 'Out for delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
};

export interface PartnerOrderAction {
    event: PartnerOrderEventType;
    buttonLabel: string;
    confirmationTitle: string;
    confirmationBody: string;
}

const NEXT_ACTIONS: Partial<Record<OrderEventType, PartnerOrderAction>> = {
    placed: {
        event: 'confirmed',
        buttonLabel: 'Confirm order',
        confirmationTitle: 'Confirm this order?',
        confirmationBody: 'The customer will see that their laundry has accepted the order.',
    },
    confirmed: {
        event: 'picked_up',
        buttonLabel: 'Mark as picked up',
        confirmationTitle: 'Mark pickup as complete?',
        confirmationBody: 'The customer will see that their clothes have been collected.',
    },
    picked_up: {
        event: 'in_progress',
        buttonLabel: 'Start cleaning',
        confirmationTitle: 'Start cleaning this order?',
        confirmationBody: 'The customer will see that cleaning is now in progress.',
    },
    in_progress: {
        event: 'out_for_delivery',
        buttonLabel: 'Send out for delivery',
        confirmationTitle: 'Send this order out for delivery?',
        confirmationBody: 'The customer will see that their clothes are on the way.',
    },
    out_for_delivery: {
        event: 'delivered',
        buttonLabel: 'Mark as delivered',
        confirmationTitle: 'Mark this order as delivered?',
        confirmationBody: 'This completes the order and cannot be undone from the portal.',
    },
};

export const nextPartnerOrderAction = (
    status: OrderStatus,
    events: Array<{ type: OrderEventType }>
) => {
    if (status === 'delivered' || status === 'cancelled') return null;
    const latest = events[events.length - 1];
    return latest ? (NEXT_ACTIONS[latest.type] ?? null) : null;
};

export const PARTNER_PORTAL_COPY = {
    eyebrow: 'Laundry operations',
    queueTitle: 'Order queue',
    queueIntro: 'Manage pickups, cleaning and deliveries across your laundry locations.',
    portalNavigation: 'Partner portal',
    settingsLink: 'Manage laundry settings',
    catalogLink: 'Manage catalogue',
    filterLabel: 'Filter orders by status',
    emptyTitle: 'No matching orders',
    emptyBody: 'There are no orders in this status right now.',
    accessTitle: 'Laundry-owner access required',
    accessBody:
        'This account is not linked to a laundry. Sign in with an owner account or return to laundrylo.',
    loadMore: 'Load more orders',
    loadingMore: 'Loading more orders…',
    loadedSuffix: 'orders loaded',
    summaryLabel: 'Today at a glance',
    activeOrders: 'Active orders',
    awaitingConfirmation: 'Awaiting confirmation',
    pickupsToday: 'Pickups today',
    deliveriesToday: 'Deliveries today',
    completedToday: 'Completed today',
    orderPrefix: 'Order ',
    itemsSuffix: 'items',
    area: 'Area',
    load: 'Load',
    pickup: 'Pickup',
    delivery: 'Delivery',
    latestUpdate: 'Latest update',
    customer: 'Customer and delivery',
    schedule: 'Schedule',
    items: 'Items',
    total: 'Order total',
    progress: 'Order progress',
    nextStep: 'Next status update',
    terminalDelivered: 'This order is complete. No further status updates are available.',
    terminalCancelled: 'This order was cancelled. No further status updates are available.',
    confirmationWarning: 'Status updates are immediately visible to the customer.',
    cancelConfirmation: 'Go back',
    updating: 'Updating…',
    backToQueue: 'All partner orders',
    returnHome: 'Return home',
    loadingQueue: 'Loading partner orders',
    loadingOrder: 'Loading partner order',
    placed: 'Placed',
    latestRecordedEvent: 'Latest recorded event',
    updateFallback: 'The status could not be updated. Try again.',
} as const;
