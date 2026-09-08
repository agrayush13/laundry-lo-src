import { useEffect, useState } from 'react';
import type {
    PartnerManagedCatalogCategory,
    PartnerManagedCatalogItem,
} from '../models/partnerCatalogModels';
import { ApiError } from '../services/apiClient';
import {
    getManagedPartnerCatalog,
    updateManagedCatalogCategory,
    updateManagedCatalogItem,
} from '../services/partnerCatalogServices';
import { getPartnerLaundries } from '../services/partnerConfigurationServices';
import { PARTNER_CATALOG_COPY } from '../config/partnerCatalogConfig';
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

    const updateItem = (itemId: string, value: Partial<ItemDraft>) => {
        clearOutcome(`item:${itemId}`);
        setItemDrafts((current) => ({
            ...current,
            [itemId]: { ...current[itemId]!, ...value },
        }));
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

        const normalizedPrice = draft.priceRupees.trim();
        const isValidPrice = /^\d+(\.\d{1,2})?$/.test(normalizedPrice);
        const price = Number(normalizedPrice);
        if (!isValidPrice || !Number.isFinite(price) || price > 1_000_000) {
            setErrors((current) => ({ ...current, [key]: PARTNER_CATALOG_COPY.priceError }));
            setInvalidFields((current) => ({ ...current, [key]: 'price' }));
            return;
        }

        setSavingKey(key);
        clearOutcome(key);
        try {
            const saved = await updateManagedCatalogItem(effectiveId, itemId, {
                name: draft.name,
                description: draft.description.trim() || null,
                price: { amount: Math.round(price * 100), currency: 'INR' },
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

    return {
        laundriesState,
        laundries,
        selected,
        selectedId: effectiveId,
        catalogState,
        categoryDrafts,
        itemDrafts,
        savingKey,
        successKey,
        errors,
        invalidFields,
        selectLaundry: (partnerId: string) => setSelectedId(partnerId),
        updateCategoryName,
        updateItem,
        saveCategory,
        saveItem,
    };
};
