import type { Order, OrderEvent, OrderStatus } from '../data/orders';
import { apiPost } from './apiClient';

export interface CreateOrderInput {
    cartId: string;
    addressId: string;
    pickupSlotId: string;
    deliverySlotId: string;
    paymentMethod: 'cash_on_pickup';
}

export const createOrder = (input: CreateOrderInput, idempotencyKey: string) =>
    apiPost<Order>('/orders', input, { headers: { 'Idempotency-Key': idempotencyKey } });

export interface CustomerOrderCancellationResult {
    orderId: string;
    status: OrderStatus;
    event: OrderEvent;
}

export const cancelCustomerOrder = (id: string) =>
    apiPost<CustomerOrderCancellationResult>(`/orders/${encodeURIComponent(id)}/cancellation`);

export interface CustomerOrderReschedulingResult {
    orderId: string;
    rescheduledAt: string;
}

export const rescheduleCustomerOrder = (
    id: string,
    input: { pickupSlotId: string; deliverySlotId: string }
) =>
    apiPost<CustomerOrderReschedulingResult>(
        `/orders/${encodeURIComponent(id)}/rescheduling`,
        input
    );
