import type {
    PartnerManagedCatalogCategory,
    PartnerManagedCatalogItem,
    PartnerManagedCatalogItemInput,
} from '../models/partnerCatalogModels';
import { apiGet, apiPatch } from './apiClient';

const partnerCatalogPath = (partnerId: string) =>
    `/partner/laundries/${encodeURIComponent(partnerId)}/catalog`;

export const getManagedPartnerCatalog = (partnerId: string, signal?: AbortSignal) =>
    apiGet<{ categories: PartnerManagedCatalogCategory[] }>(partnerCatalogPath(partnerId), {
        signal,
    }).then(({ categories }) => categories);

export const updateManagedCatalogCategory = (partnerId: string, categoryId: string, name: string) =>
    apiPatch<PartnerManagedCatalogCategory>(
        `${partnerCatalogPath(partnerId)}/categories/${encodeURIComponent(categoryId)}`,
        { name }
    );

export const updateManagedCatalogItem = (
    partnerId: string,
    itemId: string,
    input: PartnerManagedCatalogItemInput
) =>
    apiPatch<PartnerManagedCatalogItem>(
        `${partnerCatalogPath(partnerId)}/items/${encodeURIComponent(itemId)}`,
        input
    );
