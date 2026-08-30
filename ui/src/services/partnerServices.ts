import { Page } from '../models/apiModels';
import { CatalogCategory } from '../models/catalogModels';
import { Partner, PartnerDetail } from '../models/partnerModels';
import { SlotDay } from '../models/slotModels';
import { apiGet } from './apiClient';

/**
 * The only place partner data is fetched. Components and hooks call these;
 * nothing else calls `fetch`.
 */
export type PartnerSort = 'rating' | 'price' | 'distance' | 'turnaround';

export interface PartnerQuery {
    pincode?: string | undefined;
    /** Conjunctive: a partner must offer every service asked for. */
    services?: string[] | undefined;
    tags?: string[] | undefined;
    sort?: PartnerSort | undefined;
    limit?: number | undefined;
    cursor?: string | undefined;
}

export const listPartners = (query: PartnerQuery, signal?: AbortSignal) =>
    apiGet<Page<Partner>>('/partners', {
        params: {
            pincode: query.pincode,
            services: query.services,
            tags: query.tags,
            sort: query.sort,
            limit: query.limit,
            cursor: query.cursor,
        },
        ...(signal ? { signal } : {}),
    });

export const getPartner = (id: string, signal?: AbortSignal) =>
    apiGet<PartnerDetail>(`/partners/${encodeURIComponent(id)}`, {
        ...(signal ? { signal } : {}),
    });

export const getPartnerCatalog = async (id: string, signal?: AbortSignal) => {
    const { categories } = await apiGet<{ categories: CatalogCategory[] }>(
        `/partners/${encodeURIComponent(id)}/catalog`,
        { ...(signal ? { signal } : {}) }
    );
    return categories;
};

export const getPartnerSlots = async (id: string, days: number, signal?: AbortSignal) => {
    const { days: slotDays } = await apiGet<{ days: SlotDay[] }>(
        `/partners/${encodeURIComponent(id)}/slots`,
        { params: { days }, ...(signal ? { signal } : {}) }
    );
    return slotDays;
};
