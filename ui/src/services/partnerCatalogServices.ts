import type {
    PartnerManagedCatalogCategory,
    PartnerManagedCatalogCategoryInput,
    PartnerManagedCatalogItem,
    PartnerManagedCatalogItemInput,
} from '../models/partnerCatalogModels';
import { apiGet, apiPatch, apiPost } from './apiClient';

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

export const createManagedCatalogCategory = (
    partnerId: string,
    input: PartnerManagedCatalogCategoryInput
) => apiPost<PartnerManagedCatalogCategory>(`${partnerCatalogPath(partnerId)}/categories`, input);

export const updateManagedCatalogItem = (
    partnerId: string,
    itemId: string,
    input: PartnerManagedCatalogItemInput
) =>
    apiPatch<PartnerManagedCatalogItem>(
        `${partnerCatalogPath(partnerId)}/items/${encodeURIComponent(itemId)}`,
        input
    );

export const createManagedCatalogItem = (
    partnerId: string,
    categoryId: string,
    input: PartnerManagedCatalogItemInput
) =>
    apiPost<PartnerManagedCatalogItem>(
        `${partnerCatalogPath(partnerId)}/categories/${encodeURIComponent(categoryId)}/items`,
        input
    );
