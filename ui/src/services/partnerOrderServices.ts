import type { Page } from '../models/apiModels';
import type {
    PartnerOperationsSummary,
    PartnerOrderDetail,
    PartnerOrderEventResult,
    PartnerOrderEventType,
    PartnerOrderSummary,
} from '../models/partnerOrderModels';
import type { OrderStatus } from '../data/orders';
import { apiGet, apiPost } from './apiClient';

export interface PartnerOrderQuery {
    status?: OrderStatus;
    cursor?: string;
    limit?: number;
}

export const getPartnerOrders = (query: PartnerOrderQuery, signal?: AbortSignal) =>
    apiGet<Page<PartnerOrderSummary>>('/partner/orders', {
        params: {
            status: query.status,
            cursor: query.cursor,
            limit: query.limit,
        },
        signal,
    });

export const getPartnerOperationsSummary = (signal?: AbortSignal) =>
    apiGet<PartnerOperationsSummary>('/partner/orders/summary', { signal });

export const getPartnerOrder = (id: string, signal?: AbortSignal) =>
    apiGet<PartnerOrderDetail>(`/partner/orders/${encodeURIComponent(id)}`, { signal });

export const advancePartnerOrder = (id: string, type: PartnerOrderEventType) =>
    apiPost<PartnerOrderEventResult>(`/partner/orders/${encodeURIComponent(id)}/events`, {
        type,
    });
