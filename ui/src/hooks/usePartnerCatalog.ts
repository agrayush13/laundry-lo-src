import { useEffect, useState } from 'react';
import type {
    PartnerManagedCatalogCategory,
    PartnerManagedCatalogItem,
} from '../models/partnerCatalogModels';
import type { ServiceId } from '../data/services';
import { ApiError } from '../services/apiClient';
import {
    createManagedCatalogCategory,
    createManagedCatalogItem,
    getManagedPartnerCatalog,
    updateManagedCatalogCategory,
    updateManagedCatalogItem,
} from '../services/partnerCatalogServices';
import { getPartnerLaundries } from '../services/partnerConfigurationServices';
import {
    PARTNER_CATALOG_COPY,
    PARTNER_SERVICE_IDS,
    partnerServiceLabel,
} from '../config/partnerCatalogConfig';
import { useAsync } from './useAsync';

interface CategoryDraft {
    name: string;
}

interface ItemDraft {
    name: string;
    description: string;
    priceRupees: string;
    isActive: boolean;
}

interface NewCategoryDraft {
    service: ServiceId;
    name: string;
}

const blankItemDraft = (): ItemDraft => ({
    name: '',
    description: '',
    priceRupees: '',
    isActive: true,
});

const priceInput = (amount: number) =>
    (amount / 100)
        .toFixed(2)
        .replace(/\.00$/, '')
        .replace(/(\.\d)0$/, '$1');

const itemDraft = (item: PartnerManagedCatalogItem): ItemDraft => ({
    name: item.name,
    description: item.description ?? '',
    priceRupees: priceInput(item.price.amount),
    isActive: item.isActive,
});

const saveError = (error: unknown) =>
    error instanceof ApiError ? error.message : PARTNER_CATALOG_COPY.saveFallback;

export const usePartnerCatalog = () => {
    const laundriesState = useAsync(getPartnerLaundries, []);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const laundries = laundriesState.data ?? [];
    const effectiveId =
        selectedId && laundries.some(({ id }) => id === selectedId)
            ? selectedId
            : (laundries[0]?.id ?? null);
    const selected = laundries.find(({ id }) => id === effectiveId) ?? null;
    const catalogState = useAsync<PartnerManagedCatalogCategory[]>(
        (signal) =>
            effectiveId ? getManagedPartnerCatalog(effectiveId, signal) : Promise.resolve([]),
        [effectiveId]
    );
    const [categoryDrafts, setCategoryDrafts] = useState<Record<string, CategoryDraft>>({});
    const [itemDrafts, setItemDrafts] = useState<Record<string, ItemDraft>>({});
    const [newCategoryDraft, setNewCategoryDraft] = useState<NewCategoryDraft>({
        service: PARTNER_SERVICE_IDS[0],
        name: partnerServiceLabel(PARTNER_SERVICE_IDS[0]),
    });
    const [newItemDrafts, setNewItemDrafts] = useState<Record<string, ItemDraft>>({});
    const [savingKey, setSavingKey] = useState<string | null>(null);
    const [successKey, setSuccessKey] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [invalidFields, setInvalidFields] = useState<Record<string, 'name' | 'price'>>({});

    useEffect(() => {
        const categories = catalogState.data ?? [];
        setCategoryDrafts(
            Object.fromEntries(categories.map((category) => [category.id, { name: category.name }]))
        );
        setItemDrafts(
            Object.fromEntries(
                categories.flatMap((category) =>
                    category.items.map((item) => [item.id, itemDraft(item)])
                )
            )
        );
        const availableServices = PARTNER_SERVICE_IDS.filter(
            (service) => !categories.some((category) => category.service === service)
        );
        setNewCategoryDraft((current) => {
            if (availableServices.includes(current.service)) return current;
            const available = availableServices[0];
            return available
                ? { service: available, name: partnerServiceLabel(available) }
                : current;
        });
        setNewItemDrafts(
            Object.fromEntries(categories.map((category) => [category.id, blankItemDraft()]))
        );
        setSavingKey(null);
        setSuccessKey(null);
        setErrors({});
        setInvalidFields({});
    }, [catalogState.data]);

    const clearOutcome = (key: string) => {
        setSuccessKey((current) => (current === key ? null : current));
        setErrors((current) => {
            if (!(key in current)) return current;
            const next = { ...current };
            delete next[key];
            return next;
        });
        setInvalidFields((current) => {
            if (!(key in current)) return current;
            const next = { ...current };
            delete next[key];
            return next;
        });
    };

    const updateCategoryName = (categoryId: string, name: string) => {
        clearOutcome(`category:${categoryId}`);
        setCategoryDrafts((current) => ({ ...current, [categoryId]: { name } }));
    };

    const updateNewCategoryService = (service: ServiceId) => {
        clearOutcome('new-category');
        setNewCategoryDraft((current) => ({
            service,
            name:
                !current.name.trim() || current.name === partnerServiceLabel(current.service)
                    ? partnerServiceLabel(service)
                    : current.name,
        }));
    };

    const updateNewCategoryName = (name: string) => {
        clearOutcome('new-category');
        setNewCategoryDraft((current) => ({ ...current, name }));
    };

    const updateItem = (itemId: string, value: Partial<ItemDraft>) => {
        clearOutcome(`item:${itemId}`);
        setItemDrafts((current) => ({
            ...current,
            [itemId]: { ...current[itemId]!, ...value },
        }));
    };

    const updateNewItem = (categoryId: string, value: Partial<ItemDraft>) => {
        const key = `new-item:${categoryId}`;
        clearOutcome(key);
        setNewItemDrafts((current) => ({
            ...current,
            [categoryId]: { ...(current[categoryId] ?? blankItemDraft()), ...value },
        }));
    };

    const parsePrice = (key: string, priceRupees: string) => {
        const normalizedPrice = priceRupees.trim();
        const isValidPrice = /^\d+(\.\d{1,2})?$/.test(normalizedPrice);
        const price = Number(normalizedPrice);
        if (!isValidPrice || !Number.isFinite(price) || price > 1_000_000) {
            setErrors((current) => ({ ...current, [key]: PARTNER_CATALOG_COPY.priceError }));
            setInvalidFields((current) => ({ ...current, [key]: 'price' }));
            return null;
        }
        return Math.round(price * 100);
    };

    const createCategory = async () => {
        const key = 'new-category';
        if (!effectiveId || savingKey) return;
        if (!newCategoryDraft.name.trim()) {
            setErrors((current) => ({
                ...current,
                [key]: PARTNER_CATALOG_COPY.categoryNameError,
            }));
            setInvalidFields((current) => ({ ...current, [key]: 'name' }));
            return;
        }

        setSavingKey(key);
        clearOutcome(key);
        try {
            await createManagedCatalogCategory(effectiveId, newCategoryDraft);
            catalogState.reload();
        } catch (error) {
            setErrors((current) => ({ ...current, [key]: saveError(error) }));
        } finally {
            setSavingKey(null);
        }
    };

    const saveCategory = async (categoryId: string) => {
        const key = `category:${categoryId}`;
        const draft = categoryDrafts[categoryId];
        if (!effectiveId || !draft || savingKey) return;
        if (!draft.name.trim()) {
            setErrors((current) => ({
                ...current,
                [key]: PARTNER_CATALOG_COPY.categoryNameError,
            }));
            setInvalidFields((current) => ({ ...current, [key]: 'name' }));
            return;
        }
        setSavingKey(key);
        clearOutcome(key);
        try {
            const saved = await updateManagedCatalogCategory(effectiveId, categoryId, draft.name);
            setCategoryDrafts((current) => ({ ...current, [categoryId]: { name: saved.name } }));
            setSuccessKey(key);
        } catch (error) {
            setErrors((current) => ({ ...current, [key]: saveError(error) }));
        } finally {
            setSavingKey(null);
        }
    };

    const saveItem = async (itemId: string) => {
        const key = `item:${itemId}`;
        const draft = itemDrafts[itemId];
        if (!effectiveId || !draft || savingKey) return;
        if (!draft.name.trim()) {
            setErrors((current) => ({ ...current, [key]: PARTNER_CATALOG_COPY.itemNameError }));
            setInvalidFields((current) => ({ ...current, [key]: 'name' }));
            return;
        }

        const price = parsePrice(key, draft.priceRupees);
        if (price === null) return;

        setSavingKey(key);
        clearOutcome(key);
        try {
            const saved = await updateManagedCatalogItem(effectiveId, itemId, {
                name: draft.name,
                description: draft.description.trim() || null,
                price: { amount: price, currency: 'INR' },
                isActive: draft.isActive,
            });
            setItemDrafts((current) => ({ ...current, [itemId]: itemDraft(saved) }));
            setSuccessKey(key);
        } catch (error) {
            setErrors((current) => ({ ...current, [key]: saveError(error) }));
        } finally {
            setSavingKey(null);
        }
    };

    const createItem = async (categoryId: string) => {
        const key = `new-item:${categoryId}`;
        const draft = newItemDrafts[categoryId];
        if (!effectiveId || !draft || savingKey) return;
        if (!draft.name.trim()) {
            setErrors((current) => ({ ...current, [key]: PARTNER_CATALOG_COPY.itemNameError }));
            setInvalidFields((current) => ({ ...current, [key]: 'name' }));
            return;
        }
        const price = parsePrice(key, draft.priceRupees);
        if (price === null) return;

        setSavingKey(key);
        clearOutcome(key);
        try {
            await createManagedCatalogItem(effectiveId, categoryId, {
                name: draft.name,
                description: draft.description.trim() || null,
                price: { amount: price, currency: 'INR' },
                isActive: draft.isActive,
            });
            catalogState.reload();
        } catch (error) {
            setErrors((current) => ({ ...current, [key]: saveError(error) }));
        } finally {
            setSavingKey(null);
        }
    };

    const availableServices = PARTNER_SERVICE_IDS.filter(
        (service) => !catalogState.data?.some((category) => category.service === service)
    );

    return {
        laundriesState,
        laundries,
        selected,
        selectedId: effectiveId,
        catalogState,
        categoryDrafts,
        itemDrafts,
        newCategoryDraft,
        newItemDrafts,
        availableServices,
        savingKey,
        successKey,
        errors,
        invalidFields,
        selectLaundry: (partnerId: string) => setSelectedId(partnerId),
        updateCategoryName,
        updateNewCategoryService,
        updateNewCategoryName,
        updateItem,
        updateNewItem,
        createCategory,
        createItem,
        saveCategory,
        saveItem,
    };
};
