import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { SignJWT } from 'jose';
import { asCaller } from '../src/db/pool.js';
import type { CatalogCategory, PartnerCatalogCategory } from '../src/models.js';
import { get, pool, request, requireDatabase } from './helpers.js';

const OWNER = 'eeeeeeee-0000-4000-8000-000000000011';
const OTHER_OWNER = 'eeeeeeee-0000-4000-8000-000000000012';
const CUSTOMER = 'eeeeeeee-0000-4000-8000-000000000013';
const PARTNER_ID = 'ptr_test_catalog';
const CATEGORY_ID = 'cat_test_catalog_wash';
const SECOND_CATEGORY_ID = 'cat_test_catalog_dry';
const CREATED_SERVICE = 'premium-care';
const SHIRT_ID = 'itm_test_catalog_shirt';
const TOWEL_ID = 'itm_test_catalog_towel';
const CART_ID = 'crt_test_catalog';
const secret = new TextEncoder().encode(process.env['SUPABASE_JWT_SECRET']!);
const issuer = new URL('/auth/v1', process.env['SUPABASE_URL']!).toString().replace(/\/$/, '');

const authorizationFor = async (id: string, email: string) => ({
    Authorization: `Bearer ${await new SignJWT({ sub: id, email, role: 'authenticated' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuer(issuer)
        .setAudience('authenticated')
        .setExpirationTime('1h')
        .sign(secret)}`,
});

const itemInput = (overrides: Record<string, unknown> = {}) => ({
    name: 'Everyday shirt',
    description: 'Washed and neatly folded.',
    price: { amount: 2500, currency: 'INR' },
    isActive: true,
    ...overrides,
});

let ownerAuthorization: Record<string, string>;
let otherOwnerAuthorization: Record<string, string>;
let customerAuthorization: Record<string, string>;
let setupComplete = false;

beforeAll(async () => {
    await requireDatabase();
    await pool.query(
        `insert into auth.users (id, email, raw_user_meta_data)
         values ($1, 'catalog-owner@example.com', '{"full_name":"Catalog Owner"}'),
                ($2, 'catalog-other@example.com', '{"full_name":"Other Owner"}'),
                ($3, 'catalog-customer@example.com', '{"full_name":"Catalog Customer"}')
         on conflict (id) do nothing`,
        [OWNER, OTHER_OWNER, CUSTOMER]
    );
    await pool.query(
        `insert into public.partners
            (id, owner_id, name, about, line1, city, pincode, turnaround_hours)
         values ($1, $2, 'Catalog Laundry', 'Catalogue management test laundry.',
                 '12 Test Street', 'Bengaluru', '560103', 24)
         on conflict (id) do nothing`,
        [PARTNER_ID, OWNER]
    );
    await pool.query(
        `insert into public.catalog_categories (id, partner_id, service, name, position)
         values ($1, $3, 'wash-fold', 'Wash & Fold', 1),
                ($2, $3, 'dry-cleaning', 'Dry Cleaning', 2)
         on conflict (id) do nothing`,
        [CATEGORY_ID, SECOND_CATEGORY_ID, PARTNER_ID]
    );
    await pool.query(
        `insert into public.catalog_items
            (id, category_id, name, description, price, currency, unit,
             icon_key, is_active, position)
         values ($1, $3, 'Shirt', 'Original shirt description.', 2000, 'INR',
                 'piece', 'shirt', true, 1),
                ($2, $3, 'Towel', null, 1500, 'INR', 'piece', 'box', false, 2)
         on conflict (id) do nothing`,
        [SHIRT_ID, TOWEL_ID, CATEGORY_ID]
    );
    ownerAuthorization = await authorizationFor(OWNER, 'catalog-owner@example.com');
    otherOwnerAuthorization = await authorizationFor(OTHER_OWNER, 'catalog-other@example.com');
    customerAuthorization = await authorizationFor(CUSTOMER, 'catalog-customer@example.com');
    setupComplete = true;
});

beforeEach(async () => {
    await pool.query('delete from public.carts where user_id = $1', [CUSTOMER]);
    await pool.query(
        `delete from public.catalog_categories
         where partner_id = $1 and service in ('wash-iron', 'premium-care')`,
        [PARTNER_ID]
    );
    await pool.query(
        `update public.catalog_categories
         set name = case id
             when $1 then 'Wash & Fold'
             when $2 then 'Dry Cleaning'
         end
         where id = any($3::text[])`,
        [CATEGORY_ID, SECOND_CATEGORY_ID, [CATEGORY_ID, SECOND_CATEGORY_ID]]
    );
    await pool.query(
        `update public.catalog_items
         set name = case id when $1 then 'Shirt' else 'Towel' end,
             description = case id when $1 then 'Original shirt description.' else null end,
             price = case id when $1 then 2000 else 1500 end,
             is_active = id = $1
         where id = any($2::text[])`,
        [SHIRT_ID, [SHIRT_ID, TOWEL_ID]]
    );
    await pool.query(
        `insert into public.carts (id, user_id, partner_id)
         values ($1, $2, $3)`,
        [CART_ID, CUSTOMER, PARTNER_ID]
    );
    await pool.query(
        `insert into public.cart_items (cart_id, item_id, quantity)
         values ($1, $2, 2)`,
        [CART_ID, SHIRT_ID]
    );
});

afterAll(async () => {
    if (!setupComplete) {
        await pool.end();
        return;
    }
    await pool.query('delete from public.partners where id = $1', [PARTNER_ID]);
    await pool.query('delete from auth.users where id = any($1::uuid[])', [
        [OWNER, OTHER_OWNER, CUSTOMER],
    ]);
    await pool.end();
});

describe('partner catalogue management', () => {
    it('requires the owning laundry account and includes hidden items for that owner', async () => {
        const anonymous = await get(`/api/v1/partner/laundries/${PARTNER_ID}/catalog`);
        expect(anonymous.status).toBe(401);

        for (const authorization of [otherOwnerAuthorization, customerAuthorization]) {
            const hidden = await get(
                `/api/v1/partner/laundries/${PARTNER_ID}/catalog`,
                authorization
            );
            expect(hidden.status).toBe(404);
        }

        const response = await get(
            `/api/v1/partner/laundries/${PARTNER_ID}/catalog`,
            ownerAuthorization
        );
        expect(response.status).toBe(200);
        expect(response.body as { categories: PartnerCatalogCategory[] }).toMatchObject({
            categories: [
                {
                    id: CATEGORY_ID,
                    name: 'Wash & Fold',
                    items: [
                        { id: SHIRT_ID, isActive: true },
                        { id: TOWEL_ID, isActive: false },
                    ],
                },
                { id: SECOND_CATEGORY_ID, items: [] },
            ],
        });
    });

    it('creates a canonical service and customer-facing item for the owner', async () => {
        const category = await request(
            'POST',
            `/api/v1/partner/laundries/${PARTNER_ID}/catalog/categories`,
            { service: CREATED_SERVICE, name: 'Couture Care' },
            ownerAuthorization
        );
        expect(category.status).toBe(201);
        expect(category.body).toMatchObject({
            service: CREATED_SERVICE,
            name: 'Couture Care',
            items: [],
        });
        const categoryId = (category.body as PartnerCatalogCategory).id;

        const item = await request(
            'POST',
            `/api/v1/partner/laundries/${PARTNER_ID}/catalog/categories/${categoryId}/items`,
            itemInput({ name: 'Silk saree', price: { amount: 39900, currency: 'INR' } }),
            ownerAuthorization
        );
        expect(item.status).toBe(201);
        expect(item.body).toMatchObject({
            name: 'Silk saree',
            price: { amount: 39900, currency: 'INR' },
            unit: 'piece',
            iconKey: 'box',
            isActive: true,
        });

        const publicCatalog = await get(`/api/v1/partners/${PARTNER_ID}/catalog`);
        expect(publicCatalog.body as { categories: CatalogCategory[] }).toMatchObject({
            categories: expect.arrayContaining([
                expect.objectContaining({
                    id: categoryId,
                    service: CREATED_SERVICE,
                    name: 'Couture Care',
                    items: [
                        expect.objectContaining({
                            name: 'Silk saree',
                            price: { amount: 39900, currency: 'INR' },
                        }),
                    ],
                }),
            ]),
        });

        const positions = await pool.query(
            `select category.position as category_position, item.position as item_position
             from public.catalog_categories category
             join public.catalog_items item on item.category_id = category.id
             where category.id = $1`,
            [categoryId]
        );
        expect(positions.rows[0]).toEqual({ category_position: 3, item_position: 0 });
    });

    it('rejects duplicate services and malformed create requests', async () => {
        const duplicate = await request(
            'POST',
            `/api/v1/partner/laundries/${PARTNER_ID}/catalog/categories`,
            { service: 'wash-fold', name: 'Duplicate Wash' },
            ownerAuthorization
        );
        expect(duplicate.status).toBe(409);
        expect(duplicate.body).toMatchObject({ error: { code: 'SERVICE_ALREADY_EXISTS' } });

        const invalidCategory = await request(
            'POST',
            `/api/v1/partner/laundries/${PARTNER_ID}/catalog/categories`,
            { service: 'unknown-service', name: '' },
            ownerAuthorization
        );
        expect(invalidCategory.status).toBe(422);
        expect(invalidCategory.body).toMatchObject({ error: { code: 'VALIDATION_FAILED' } });

        const invalidItem = await request(
            'POST',
            `/api/v1/partner/laundries/${PARTNER_ID}/catalog/categories/${CATEGORY_ID}/items`,
            itemInput({ price: { amount: -1, currency: 'INR' } }),
            ownerAuthorization
        );
        expect(invalidItem.status).toBe(422);
        expect(invalidItem.body).toMatchObject({ error: { code: 'VALIDATION_FAILED' } });
    });

    it('updates customer-facing names, descriptions, prices and availability', async () => {
        const category = await request(
            'PATCH',
            `/api/v1/partner/laundries/${PARTNER_ID}/catalog/categories/${CATEGORY_ID}`,
            { name: 'Everyday Laundry' },
            ownerAuthorization
        );
        expect(category.status).toBe(200);
        expect(category.body).toMatchObject({ id: CATEGORY_ID, name: 'Everyday Laundry' });

        const shirt = await request(
            'PATCH',
            `/api/v1/partner/laundries/${PARTNER_ID}/catalog/items/${SHIRT_ID}`,
            itemInput(),
            ownerAuthorization
        );
        expect(shirt.status).toBe(200);
        expect(shirt.body).toMatchObject({
            id: SHIRT_ID,
            name: 'Everyday shirt',
            description: 'Washed and neatly folded.',
            price: { amount: 2500, currency: 'INR' },
            isActive: true,
        });

        const towel = await request(
            'PATCH',
            `/api/v1/partner/laundries/${PARTNER_ID}/catalog/items/${TOWEL_ID}`,
            itemInput({ name: 'Towel', description: null, isActive: false }),
            ownerAuthorization
        );
        expect(towel.status).toBe(200);

        const publicCatalog = await get(`/api/v1/partners/${PARTNER_ID}/catalog`);
        expect(publicCatalog.status).toBe(200);
        expect(publicCatalog.body as { categories: CatalogCategory[] }).toMatchObject({
            categories: [
                {
                    id: CATEGORY_ID,
                    name: 'Everyday Laundry',
                    items: [
                        {
                            id: SHIRT_ID,
                            name: 'Everyday shirt',
                            description: 'Washed and neatly folded.',
                            price: { amount: 2500, currency: 'INR' },
                        },
                    ],
                },
                { id: SECOND_CATEGORY_ID, items: [] },
            ],
        });
    });

    it('hides rather than deletes an item referenced by a customer cart', async () => {
        const response = await request(
            'PATCH',
            `/api/v1/partner/laundries/${PARTNER_ID}/catalog/items/${SHIRT_ID}`,
            itemInput({ isActive: false }),
            ownerAuthorization
        );
        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({ id: SHIRT_ID, isActive: false });

        const reference = await pool.query(
            `select quantity from public.cart_items where cart_id = $1 and item_id = $2`,
            [CART_ID, SHIRT_ID]
        );
        expect(reference.rows[0]).toEqual({ quantity: 2 });

        const publicCatalog = await get(`/api/v1/partners/${PARTNER_ID}/catalog`);
        const categories = (publicCatalog.body as { categories: CatalogCategory[] }).categories;
        expect(categories.flatMap(({ items }) => items).some(({ id }) => id === SHIRT_ID)).toBe(
            false
        );
    });

    it('rejects malformed edits without changing stored catalogue data', async () => {
        const invalidRequests: Array<[string, unknown]> = [
            [
                `/api/v1/partner/laundries/${PARTNER_ID}/catalog/categories/${CATEGORY_ID}`,
                { name: '   ' },
            ],
            [
                `/api/v1/partner/laundries/${PARTNER_ID}/catalog/items/${SHIRT_ID}`,
                itemInput({ name: '' }),
            ],
            [
                `/api/v1/partner/laundries/${PARTNER_ID}/catalog/items/${SHIRT_ID}`,
                itemInput({ price: { amount: 10.5, currency: 'INR' } }),
            ],
            [
                `/api/v1/partner/laundries/${PARTNER_ID}/catalog/items/${SHIRT_ID}`,
                itemInput({ price: { amount: 100, currency: 'USD' } }),
            ],
            [
                `/api/v1/partner/laundries/${PARTNER_ID}/catalog/items/${SHIRT_ID}`,
                itemInput({ description: 'x'.repeat(501) }),
            ],
        ];

        for (const [path, body] of invalidRequests) {
            const response = await request('PATCH', path, body, ownerAuthorization);
            expect(response.status).toBe(422);
            expect(response.body).toMatchObject({ error: { code: 'VALIDATION_FAILED' } });
        }

        const stored = await pool.query(
            `select name, description, price, is_active
             from public.catalog_items where id = $1`,
            [SHIRT_ID]
        );
        expect(stored.rows[0]).toEqual({
            name: 'Shirt',
            description: 'Original shirt description.',
            price: 2000,
            is_active: true,
        });
    });

    it('hides catalogue writes from another owner', async () => {
        const createdCategory = await request(
            'POST',
            `/api/v1/partner/laundries/${PARTNER_ID}/catalog/categories`,
            { service: CREATED_SERVICE, name: 'Not yours' },
            otherOwnerAuthorization
        );
        expect(createdCategory.status).toBe(404);

        const createdItem = await request(
            'POST',
            `/api/v1/partner/laundries/${PARTNER_ID}/catalog/categories/${CATEGORY_ID}/items`,
            itemInput(),
            otherOwnerAuthorization
        );
        expect(createdItem.status).toBe(404);

        const category = await request(
            'PATCH',
            `/api/v1/partner/laundries/${PARTNER_ID}/catalog/categories/${CATEGORY_ID}`,
            { name: 'Not yours' },
            otherOwnerAuthorization
        );
        expect(category.status).toBe(404);

        const item = await request(
            'PATCH',
            `/api/v1/partner/laundries/${PARTNER_ID}/catalog/items/${SHIRT_ID}`,
            itemInput(),
            otherOwnerAuthorization
        );
        expect(item.status).toBe(404);
    });

    it('allows only approved owner columns at the database boundary', async () => {
        const category = await asCaller(pool, OWNER, (client) =>
            client.query(
                'update public.catalog_categories set name = $2 where id = $1 returning name',
                [CATEGORY_ID, 'Owner-approved name']
            )
        );
        expect(category.rows[0]).toEqual({ name: 'Owner-approved name' });

        const hidden = await asCaller(pool, OTHER_OWNER, (client) =>
            client.query(
                'update public.catalog_items set price = $2 where id = $1 returning price',
                [SHIRT_ID, 9999]
            )
        );
        expect(hidden.rowCount).toBe(0);

        await expect(
            asCaller(pool, OWNER, (client) =>
                client.query('update public.catalog_items set category_id = $2 where id = $1', [
                    SHIRT_ID,
                    SECOND_CATEGORY_ID,
                ])
            )
        ).rejects.toThrow(/permission denied/i);

        await expect(
            asCaller(pool, null, (client) =>
                client.query(
                    `select public.create_partner_catalog_category($1, 'premium-care', 'No auth')`,
                    [PARTNER_ID]
                )
            )
        ).rejects.toThrow(/permission denied/i);

        await expect(
            asCaller(pool, OWNER, (client) =>
                client.query(
                    `insert into public.catalog_categories (partner_id, service, name)
                     values ($1, 'premium-care', 'Direct insert')`,
                    [PARTNER_ID]
                )
            )
        ).rejects.toThrow(/permission denied/i);
        await expect(
            asCaller(pool, OWNER, (client) =>
                client.query(
                    "update public.catalog_categories set service = 'premium-care' where id = $1",
                    [CATEGORY_ID]
                )
            )
        ).rejects.toThrow(/permission denied/i);
    });
});
