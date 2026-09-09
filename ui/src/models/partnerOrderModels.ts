import type { Order, OrderEvent, OrderEventType, OrderStatus } from '../data/orders';
import type { Money } from './moneyModels';

export interface PartnerOrderSummary {
    id: string;
    reference: string;
    status: OrderStatus;
    placedAt: string;
    partner: { id: string; name: string };
    recipient: { name: string; pincode: string };
    itemCount: number;
    total: Money;
    pickup: { startsAt: string; endsAt: string };
    delivery: { startsAt: string; endsAt: string };
    latestEvent: OrderEvent;
}

export interface PartnerOperationsSummary {
    activeOrders: number;
    awaitingConfirmation: number;
    pickupsToday: number;
    deliveriesToday: number;
    completedToday: number;
    generatedAt: string;
}

export interface PartnerOrderDetail extends Omit<
    Order,
    'deliveryAddress' | 'canCancel' | 'canReschedule'
> {
    deliveryAddress: Order['deliveryAddress'] & {
        recipientName: string;
        phone: string;
        landmark: string;
    };
    pickup: { date: string; startsAt: string; endsAt: string };
    delivery: { date: string; startsAt: string; endsAt: string };
}

export type PartnerOrderEventType = Exclude<OrderEventType, 'placed' | 'cancelled'>;

export interface PartnerOrderEventResult {
    orderId: string;
    status: OrderStatus;
    event: OrderEvent;
}
