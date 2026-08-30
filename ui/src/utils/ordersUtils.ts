import { Order, OrderEvent } from '../data/orders';
import { ORDER_STEPS, TIMELINE_COPY } from '../config/ordersConfig';
import { formatEventTime } from './datesUtils';

/**
 * The two identifiers an order carries, which are deliberately not the same
 * value. `id` is what a lookup uses and must not be guessable, because it is the
 * only thing between a URL and someone else's laundry. `reference` is what the
 * customer reads out on the phone, and is allowed to be short and friendly
 * precisely because nothing is fetched by it.
 *
 * Minted here only until `POST /orders` exists; the server owns both then, and
 * `orders.id` / `orders.reference` are already separate columns waiting for it.
 */
export interface OrderIdentifiers {
    orderId: string;
    orderReference: string;
}

const randomBytes = (count: number) => {
    const bytes = new Uint8Array(count);
    // `Math.random` is a seeded PRNG. An order id drawn from it is guessable in
    // roughly a million tries, which is not a lookup key.
    crypto.getRandomValues(bytes);
    return bytes;
};

const toHex = (bytes: Uint8Array) =>
    Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

export const createOrderIdentifiers = (): OrderIdentifiers => {
    const bytes = randomBytes(16);

    return {
        // `ord_` matches the prefix the database mints, so the shape a customer
        // sees in a URL does not change when the server takes this over.
        orderId: `ord_${toHex(bytes)}`,
        // Four digits, so it reads aloud without spelling anything out. Random
        // rather than sequential because a client cannot know the sequence.
        orderReference: `LL-${new Date().getFullYear()}-${String(
            ((bytes[0]! << 8) | bytes[1]!) % 10000
        ).padStart(4, '0')}`,
    };
};

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
    const cancelledAt = occurred.get('cancelled');

    if (cancelledAt) {
        return [
            ...ORDER_STEPS.filter(({ type }) => occurred.has(type)).map(({ type, label }) => ({
                label,
                detail: formatEventTime(occurred.get(type)!),
                state: 'done' as const,
            })),
            {
                label: TIMELINE_COPY.cancelled,
                detail: formatEventTime(cancelledAt),
                state: 'current' as const,
            },
        ];
    }

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
