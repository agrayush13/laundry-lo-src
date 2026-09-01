import type { Order } from '../data/orders';
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
