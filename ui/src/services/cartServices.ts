import type { PriceUnit } from '../models/catalogModels';
import type { Money } from '../models/moneyModels';
import { apiDelete, apiGet, apiPost, apiPut } from './apiClient';

export interface ServerCartLine {
    itemId: string;
    name: string;
    description: string | null;
    categoryName: string;
    iconKey: string;
    quantity: number;
    unit: PriceUnit;
    unitPrice: Money;
    lineTotal: Money;
}

export interface ServerCart {
    id: string | null;
    partner: { id: string; name: string } | null;
    items: ServerCartLine[];
    membership: { plan: 'plus'; price: Money; period: 'month' } | null;
    totals: {
        subtotal: Money;
        delivery: Money;
        membership: Money;
        discount: Money;
        tax: Money;
        total: Money;
    };
}

export const getCart = () => apiGet<ServerCart>('/cart');
export const setCartItem = (itemId: string, quantity: number) =>
    apiPut<ServerCart>(`/cart/items/${encodeURIComponent(itemId)}`, { quantity });
export const addCartMembership = () => apiPost<ServerCart>('/cart/membership');
export const removeCartMembership = () => apiDelete<ServerCart>('/cart/membership');
export const clearCart = () => apiDelete('/cart');
