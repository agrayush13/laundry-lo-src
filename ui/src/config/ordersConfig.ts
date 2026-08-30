import { OrderEventType, OrderStatus } from '../data/orders';
import { IconName } from '../common-ui/icons/registry';

export const STATUS_LABELS: Record<OrderStatus, string> = {
    processing: 'Processing',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
};

export const STATUS_ICONS: Record<OrderStatus, IconName> = {
    processing: 'refresh',
    out_for_delivery: 'truck',
    delivered: 'check-circle',
    cancelled: 'alert',
};

/**
 * The sequence every order follows. The API sends only the events that have
 * happened; the client renders this list and marks each step from them.
 */
export const ORDER_STEPS: { type: OrderEventType; label: string }[] = [
    { type: 'placed', label: 'Order Placed' },
    { type: 'confirmed', label: 'Confirmed by Vendor' },
    { type: 'picked_up', label: 'Clothes Picked Up' },
    { type: 'in_progress', label: 'Washing & Cleaning' },
    { type: 'out_for_delivery', label: 'Out for Delivery' },
    { type: 'delivered', label: 'Delivered' },
];

export const TIMELINE_COPY = {
    pending: 'Pending',
    inProgress: 'In progress',
    cancelled: 'Order Cancelled',
} as const;
