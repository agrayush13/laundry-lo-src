import { Order, OrderEvent } from '../data/orders';
import { ORDER_STEPS, TIMELINE_COPY } from '../config/ordersConfig';
import { formatEventTime } from './datesUtils';

export const createOrderId = () => `LL${Math.floor(100000 + Math.random() * 900000)}`;

export type TimelineState = 'done' | 'current' | 'pending';

export interface TimelineEntry {
    label: string;
    detail: string;
    state: TimelineState;
}

/**
 * Turns the events that happened into the full six-step timeline, marking the
 * most recent event as current and everything after it as pending.
 */
export const buildTimeline = (events: OrderEvent[]): TimelineEntry[] => {
    const occurred = new Map(events.map((event) => [event.type, event.occurredAt]));
    const lastType = events[events.length - 1]?.type;

    return ORDER_STEPS.map(({ type, label }, index) => {
        const at = occurred.get(type);

        if (!at) {
            const isNext = ORDER_STEPS.findIndex((step) => step.type === lastType) + 1 === index;
            return {
                label,
                detail: isNext ? TIMELINE_COPY.inProgress : TIMELINE_COPY.pending,
                state: 'pending' as const,
            };
        }

        return {
            label,
            detail: formatEventTime(at),
            state: type === lastType ? ('current' as const) : ('done' as const),
        };
    });
};

export const formatOrderAddress = ({ deliveryAddress }: Order) =>
    `${deliveryAddress.building}, ${deliveryAddress.street} ${deliveryAddress.pincode}`;
