import type { Client } from '../db/pool.js';
import { money } from '../http/money.js';
import type {
    PartnerCatalogCategory,
    PartnerCatalogItem,
    PriceUnit,
    ServiceId,
} from '../models.js';

interface PartnerCatalogRow {
    category_id: string;
    service: ServiceId;
    category_name: string;
    item_id: string | null;
    item_name: string | null;
    description: string | null;
    price: number | null;
    currency: string | null;
    unit: PriceUnit | null;
    icon_key: string | null;
    is_active: boolean | null;
}

export interface PartnerCatalogItemInput {
    name: string;
    description: string | null;
    price: { amount: number; currency: 'INR' };
    isActive: boolean;
}

const toCatalog = (rows: PartnerCatalogRow[]): PartnerCatalogCategory[] => {
    const categories = new Map<string, PartnerCatalogCategory>();

    for (const row of rows) {
        let category = categories.get(row.category_id);
        if (!category) {
            category = {
                id: row.category_id,
                service: row.service,
                name: row.category_name,
                items: [],
            };
            categories.set(row.category_id, category);
        }
        if (row.item_id) {
            category.items.push({
                id: row.item_id,
                name: row.item_name ?? '',
                description: row.description,
                price: money(row.price ?? 0, row.currency ?? 'INR'),
                unit: row.unit ?? 'piece',
                iconKey: row.icon_key ?? 'box',
                isActive: row.is_active ?? false,
            });
        }
    }

    return [...categories.values()];
};

export const getOwnedPartnerCatalog = async (
    client: Client,
    partnerId: string
): Promise<PartnerCatalogCategory[] | null> => {
    const owner = await client.query(
        'select 1 from public.partners where id = $1 and owner_id = auth.uid()',
        [partnerId]
    );
    if (owner.rowCount === 0) return null;

    const { rows } = await client.query<PartnerCatalogRow>(
        `select c.id as category_id, c.service, c.name as category_name,
                i.id as item_id, i.name as item_name, i.description,
                i.price, i.currency, i.unit, i.icon_key, i.is_active
         from public.catalog_categories c
         left join public.catalog_items i on i.category_id = c.id
         where c.partner_id = $1
         order by c.position, c.id, i.position, i.id`,
        [partnerId]
    );
    return toCatalog(rows);
};

export const updateOwnedCatalogCategory = async (
    client: Client,
    partnerId: string,
    categoryId: string,
    name: string
): Promise<PartnerCatalogCategory | null> => {
    const result = await client.query(
        `update public.catalog_categories
         set name = $3
         where id = $2 and partner_id = $1
           and exists (
               select 1 from public.partners
               where id = $1 and owner_id = auth.uid()
           )`,
        [partnerId, categoryId, name]
    );
    if (result.rowCount === 0) return null;
    return (
        (await getOwnedPartnerCatalog(client, partnerId))?.find(({ id }) => id === categoryId) ??
        null
    );
};

export const updateOwnedCatalogItem = async (
    client: Client,
    partnerId: string,
    itemId: string,
    input: PartnerCatalogItemInput
): Promise<PartnerCatalogItem | null> => {
    const result = await client.query(
        `update public.catalog_items item
         set name = $3,
             description = $4,
             price = $5,
             is_active = $6
         from public.catalog_categories category
         where item.id = $2
           and item.category_id = category.id
           and category.partner_id = $1
           and exists (
               select 1 from public.partners
               where id = $1 and owner_id = auth.uid()
           )`,
        [partnerId, itemId, input.name, input.description, input.price.amount, input.isActive]
    );
    if (result.rowCount === 0) return null;
    const catalog = await getOwnedPartnerCatalog(client, partnerId);
    return catalog?.flatMap(({ items }) => items).find(({ id }) => id === itemId) ?? null;
};
