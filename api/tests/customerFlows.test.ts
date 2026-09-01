import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SignJWT } from 'jose';
import type { Cart, Order, Page, Profile, SavedAddress } from '../src/models.js';
import { get, pool, request, requireDatabase } from './helpers.js';

const CUSTOMER = 'cccccccc-0000-4000-8000-000000000003';
const OTHER_CUSTOMER = 'dddddddd-0000-4000-8000-000000000004';
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

let authorization: Record<string, string>;
let otherAuthorization: Record<string, string>;

beforeAll(async () => {
    await requireDatabase();
    await pool.query(
        `insert into auth.users (id, email, raw_user_meta_data)
         values ($1, 'customer@example.com', '{"full_name":"Demo Customer"}'),
                ($2, 'other@example.com', '{}')
         on conflict (id) do nothing`,
        [CUSTOMER, OTHER_CUSTOMER]
    );
    authorization = await authorizationFor(CUSTOMER, 'customer@example.com');
    otherAuthorization = await authorizationFor(OTHER_CUSTOMER, 'other@example.com');
});

afterAll(async () => {
    await pool.query(
        `with reservations as (
             select pickup_slot_id as id from public.orders where user_id = any($1::uuid[])
             union all
             select delivery_slot_id as id from public.orders where user_id = any($1::uuid[])
         ), counts as (
             select id, count(*)::integer as reserved from reservations group by id
         )
         update public.slots s
         set booked = greatest(0, s.booked - counts.reserved),
             state = case when s.state = 'full' then 'open'::public.slot_state else s.state end
         from counts where s.id = counts.id`,
        [[CUSTOMER, OTHER_CUSTOMER]]
    );
    await pool.query('delete from public.orders where user_id = any($1::uuid[])', [
        [CUSTOMER, OTHER_CUSTOMER],
    ]);
    await pool.query('delete from auth.users where id = any($1::uuid[])', [
        [CUSTOMER, OTHER_CUSTOMER],
    ]);
    await pool.end();
});

describe('profile and addresses', () => {
    it('requires a verified session for customer data', async () => {
        const { status, body } = await get('/api/v1/me');
        expect(status).toBe(401);
        expect(body).toMatchObject({ error: { code: 'UNAUTHENTICATED' } });
    });

    it('reads and updates the app profile without owning credentials', async () => {
        const before = await get('/api/v1/me', authorization);
        expect(before.status).toBe(200);
        expect(before.body).toMatchObject({
            id: CUSTOMER,
            fullName: 'Demo Customer',
            email: 'customer@example.com',
        });

        const updated = await request(
            'PATCH',
            '/api/v1/me',
            { fullName: 'Customer One', phone: '+91 90000 00000', preferences: { email: true } },
            authorization
        );
        expect(updated.status).toBe(200);
        expect(updated.body as Profile).toMatchObject({
            fullName: 'Customer One',
            phone: '+91 90000 00000',
            preferences: { sms: true, email: true },
        });
    });

    it('creates one default address and transfers the default explicitly', async () => {
        const [home, office] = await Promise.all([
            request(
                'POST',
                '/api/v1/addresses',
                {
                    label: 'Home',
                    recipientName: 'Customer One',
                    phone: '+91 90000 00000',
                    building: '42',
                    street: 'HSR Layout',
                    landmark: '',
                    pincode: '560103',
                },
                authorization
            ),
            request(
                'POST',
                '/api/v1/addresses',
                {
                    label: 'Office',
                    recipientName: 'Customer One',
                    phone: '+91 90000 00000',
                    building: '8',
                    street: 'MG Road',
                    landmark: 'Metro',
                    pincode: '560103',
                },
                authorization
            ),
        ]);
        expect(home.status).toBe(201);
        expect(office.status).toBe(201);
        expect(
            [home.body, office.body].filter((address) => (address as SavedAddress).isDefault)
        ).toHaveLength(1);

        const officeId = (office.body as SavedAddress).id;
        const madeDefault = await request(
            'PATCH',
            `/api/v1/addresses/${officeId}`,
            { isDefault: true },
            authorization
        );
        expect(madeDefault.body).toMatchObject({ id: officeId, isDefault: true });

        const cannotUnsetDefault = await request(
            'PATCH',
            `/api/v1/addresses/${officeId}`,
            { isDefault: false },
            authorization
        );
        expect(cannotUnsetDefault.status).toBe(422);
        expect(cannotUnsetDefault.body).toMatchObject({ error: { code: 'VALIDATION_FAILED' } });

        const list = await get('/api/v1/addresses', authorization);
        const addresses = (list.body as { data: SavedAddress[] }).data;
        expect(addresses).toHaveLength(2);
        expect(addresses.filter(({ isDefault }) => isDefault)).toHaveLength(1);
        expect(addresses[0]?.id).toBe(officeId);

        const hidden = await get('/api/v1/addresses', otherAuthorization);
        expect((hidden.body as { data: SavedAddress[] }).data).toEqual([]);
    });
});

describe('cart, membership and order placement', () => {
    it('prices the cart on the server and rejects a second partner', async () => {
        const first = await request(
            'PUT',
            '/api/v1/cart/items/itm_1001_wf-shirt',
            { quantity: 3 },
            authorization
        );
        const cart = first.body as Cart;
        expect(first.status).toBe(200);
        expect(cart).toMatchObject({
            partner: { id: '1001' },
            totals: {
                subtotal: { amount: 6000 },
                discount: { amount: 0 },
                tax: { amount: 1080 },
                total: { amount: 7080 },
            },
        });

        const conflict = await request(
            'PUT',
            '/api/v1/cart/items/itm_1002_wf-shirt',
            { quantity: 1 },
            authorization
        );
        expect(conflict.status).toBe(409);
        expect(conflict.body).toMatchObject({ error: { code: 'CART_PARTNER_CONFLICT' } });
    });

    it('adds Plus, places atomically, and makes retries idempotent', async () => {
        const withPlus = await request('POST', '/api/v1/cart/membership', undefined, authorization);
        expect(withPlus.body).toMatchObject({
            membership: { plan: 'plus', price: { amount: 9900 } },
            totals: { discount: { amount: 600 } },
        });

        const cart = withPlus.body as Cart;
        const addresses = await get('/api/v1/addresses', authorization);
        const addressId = (addresses.body as { data: SavedAddress[] }).data[0]!.id;
        const slots = await pool.query<{ id: string; booked: number }>(
            `select id, booked from public.slots
             where partner_id = '1001' and state = 'open' and booked < capacity and starts_at > now()
             order by starts_at limit 2`
        );
        expect(slots.rows).toHaveLength(2);
        const key = '11111111-2222-4333-8444-555555555555';
        const payload = {
            cartId: cart.id,
            addressId,
            pickupSlotId: slots.rows[0]!.id,
            deliverySlotId: slots.rows[1]!.id,
            paymentMethod: 'cash_on_pickup',
        };

        const attempts = await Promise.all([
            request('POST', '/api/v1/orders', payload, {
                ...authorization,
                'Idempotency-Key': key,
            }),
            request('POST', '/api/v1/orders', payload, {
                ...authorization,
                'Idempotency-Key': key,
            }),
        ]);
        const placed = attempts.find(({ status }) => status === 201)!;
        const retried = attempts.find(({ status }) => status === 200)!;
        expect(placed.status).toBe(201);
        const order = placed.body as Order;
        expect(order).toMatchObject({
            partner: { id: '1001' },
            totals: {
                subtotal: { amount: 6000 },
                membership: { amount: 9900 },
                discount: { amount: 600 },
                tax: { amount: 2754 },
                total: { amount: 18054 },
            },
            events: [{ type: 'placed' }],
        });

        expect(retried.status).toBe(200);
        expect((retried.body as Order).id).toBe(order.id);

        const emptyCart = await get('/api/v1/cart', authorization);
        expect(emptyCart.body).toMatchObject({ id: null, items: [] });
        const membership = await get('/api/v1/me/membership', authorization);
        expect(membership.body).toMatchObject({ plan: 'plus', isActive: true });

        const list = await get('/api/v1/orders', authorization);
        expect((list.body as Page<Order>).data.map(({ id }) => id)).toContain(order.id);
        const detail = await get(`/api/v1/orders/${order.id}`, authorization);
        expect(detail.body).toEqual(order);
        const privateDetail = await get(`/api/v1/orders/${order.id}`, otherAuthorization);
        expect(privateDetail.status).toBe(404);

        const reserved = await pool.query<{ booked: number }>(
            'select booked from public.slots where id = any($1::text[]) order by id',
            [slots.rows.map(({ id }) => id)]
        );
        expect(reserved.rows.map(({ booked }) => booked).sort()).toEqual(
            slots.rows.map(({ booked }) => booked + 1).sort()
        );
    });

    it('publishes the Plus plan without requiring a session', async () => {
        const plans = await get('/api/v1/membership/plans');
        expect(plans.status).toBe(200);
        expect(plans.body).toMatchObject({ data: [{ id: 'plus', price: { amount: 9900 } }] });
    });

    it('keeps concurrent first cart additions instead of losing one', async () => {
        const additions = await Promise.all([
            request('PUT', '/api/v1/cart/items/itm_1001_wf-shirt', { quantity: 1 }, authorization),
            request(
                'PUT',
                '/api/v1/cart/items/itm_1001_wf-trousers',
                { quantity: 2 },
                authorization
            ),
        ]);
        expect(additions.map(({ status }) => status)).toEqual([200, 200]);

        const cart = await get('/api/v1/cart', authorization);
        expect((cart.body as Cart).items).toMatchObject([
            { itemId: 'itm_1001_wf-shirt', quantity: 1 },
            { itemId: 'itm_1001_wf-trousers', quantity: 2 },
        ]);
        await request('DELETE', '/api/v1/cart', undefined, authorization);
    });

    it('keeps the cart and rolls back every write when a slot is unavailable', async () => {
        const cartResponse = await request(
            'PUT',
            '/api/v1/cart/items/itm_1001_wf-shirt',
            { quantity: 1 },
            authorization
        );
        const cart = cartResponse.body as Cart;
        const addresses = await get('/api/v1/addresses', authorization);
        const addressId = (addresses.body as { data: SavedAddress[] }).data[0]!.id;

        await pool.query(
            `insert into public.slots
                (id, partner_id, starts_at, ends_at, capacity, booked, state)
             values
                ('slt_test_full', '1001', now() + interval '40 days', now() + interval '40 days 2 hours', 1, 1, 'full'),
                ('slt_test_delivery', '1001', now() + interval '40 days 4 hours', now() + interval '40 days 6 hours', 1, 0, 'open')`
        );

        try {
            const failed = await request(
                'POST',
                '/api/v1/orders',
                {
                    cartId: cart.id,
                    addressId,
                    pickupSlotId: 'slt_test_full',
                    deliverySlotId: 'slt_test_delivery',
                    paymentMethod: 'cash_on_pickup',
                },
                {
                    ...authorization,
                    'Idempotency-Key': '99999999-8888-4777-8666-555555555555',
                }
            );
            expect(failed.status).toBe(409);
            expect(failed.body).toMatchObject({ error: { code: 'SLOT_UNAVAILABLE' } });

            const preserved = await get('/api/v1/cart', authorization);
            expect(preserved.body).toMatchObject({ id: cart.id, items: [{ quantity: 1 }] });
            const delivery = await pool.query<{ booked: number }>(
                "select booked from public.slots where id = 'slt_test_delivery'"
            );
            expect(delivery.rows[0]?.booked).toBe(0);
        } finally {
            await request('DELETE', '/api/v1/cart', undefined, authorization);
            await pool.query(
                "delete from public.slots where id in ('slt_test_full', 'slt_test_delivery')"
            );
        }
    });

    it('refuses to silently omit a cart item that became unavailable', async () => {
        await pool.query(
            `insert into public.catalog_categories (id, partner_id, service, name, position)
             values ('cat_test_stale', '1001', 'wash-fold', 'Temporary test category', 999);
             insert into public.catalog_items
                 (id, category_id, name, price, unit, icon_key, position)
             values
                 ('itm_test_stale', 'cat_test_stale', 'Temporary test item', 2500,
                  'piece', 'shirt', 999)`
        );

        try {
            const cartResponse = await request(
                'PUT',
                '/api/v1/cart/items/itm_test_stale',
                { quantity: 1 },
                authorization
            );
            const cart = cartResponse.body as Cart;
            const addresses = await get('/api/v1/addresses', authorization);
            const addressId = (addresses.body as { data: SavedAddress[] }).data[0]!.id;

            await pool.query(
                `update public.catalog_items set is_active = false where id = 'itm_test_stale';
                 insert into public.slots
                     (id, partner_id, starts_at, ends_at, capacity, booked, state)
                 values
                     ('slt_test_stale_pickup', '1001', now() + interval '41 days',
                      now() + interval '41 days 2 hours', 1, 0, 'open'),
                     ('slt_test_stale_delivery', '1001', now() + interval '41 days 4 hours',
                      now() + interval '41 days 6 hours', 1, 0, 'open')`
            );

            const failed = await request(
                'POST',
                '/api/v1/orders',
                {
                    cartId: cart.id,
                    addressId,
                    pickupSlotId: 'slt_test_stale_pickup',
                    deliverySlotId: 'slt_test_stale_delivery',
                    paymentMethod: 'cash_on_pickup',
                },
                {
                    ...authorization,
                    'Idempotency-Key': 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
                }
            );
            expect(failed.status).toBe(409);
            expect(failed.body).toMatchObject({ error: { code: 'CART_CHANGED' } });

            const preserved = await pool.query<{ item_id: string }>(
                `select ci.item_id from public.cart_items ci
                 join public.carts c on c.id = ci.cart_id
                 where c.user_id = $1`,
                [CUSTOMER]
            );
            expect(preserved.rows).toEqual([{ item_id: 'itm_test_stale' }]);
            const slots = await pool.query<{ booked: number }>(
                `select booked from public.slots
                 where id in ('slt_test_stale_pickup', 'slt_test_stale_delivery')
                 order by id`
            );
            expect(slots.rows).toEqual([{ booked: 0 }, { booked: 0 }]);
        } finally {
            await request('DELETE', '/api/v1/cart', undefined, authorization);
            await pool.query(
                `delete from public.slots
                 where id in ('slt_test_stale_pickup', 'slt_test_stale_delivery');
                 delete from public.catalog_categories where id = 'cat_test_stale'`
            );
        }
    });
});
