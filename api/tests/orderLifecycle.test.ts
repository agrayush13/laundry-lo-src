import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { SignJWT } from 'jose';
import { asCaller } from '../src/db/pool.js';
import type { Order, Page, PartnerOperationsSummary, PartnerOrderSummary } from '../src/models.js';
import { get, pool, request, requireDatabase } from './helpers.js';

const CUSTOMER = 'eeeeeeee-0000-4000-8000-000000000005';
const OWNER = 'eeeeeeee-0000-4000-8000-000000000006';
const OTHER_OWNER = 'eeeeeeee-0000-4000-8000-000000000007';
const ORDER_ID = 'ord_test_lifecycle';
const SECOND_ORDER_ID = 'ord_test_lifecycle_older';
const PICKUP_SLOT_ID = 'slt_test_lifecycle_pickup';
const DELIVERY_SLOT_ID = 'slt_test_lifecycle_delivery';
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

let customerAuthorization: Record<string, string>;
let ownerAuthorization: Record<string, string>;
let otherOwnerAuthorization: Record<string, string>;
let setupComplete = false;

beforeAll(async () => {
    await requireDatabase();
    await pool.query(
        `insert into auth.users (id, email, raw_user_meta_data)
         values ($1, 'lifecycle-customer@example.com', '{"full_name":"Lifecycle Customer"}'),
                ($2, 'lifecycle-owner@example.com', '{"full_name":"Lifecycle Owner"}'),
                ($3, 'lifecycle-other-owner@example.com', '{"full_name":"Other Owner"}')
         on conflict (id) do nothing`,
        [CUSTOMER, OWNER, OTHER_OWNER]
    );
    await pool.query(
        `update public.partners
         set owner_id = case id when '1001' then $1::uuid when '1002' then $2::uuid end
         where id in ('1001', '1002')`,
        [OWNER, OTHER_OWNER]
    );
    await pool.query(
        `insert into public.slots
            (id, partner_id, starts_at, ends_at, capacity, booked, state)
         values
            ($1, '1001', now() + interval '40 days', now() + interval '40 days 2 hours', 10, 1, 'open'),
            ($2, '1001', now() + interval '40 days 4 hours', now() + interval '40 days 6 hours', 10, 1, 'open')
         on conflict (id) do nothing`,
        [PICKUP_SLOT_ID, DELIVERY_SLOT_ID]
    );
    customerAuthorization = await authorizationFor(CUSTOMER, 'lifecycle-customer@example.com');
    ownerAuthorization = await authorizationFor(OWNER, 'lifecycle-owner@example.com');
    otherOwnerAuthorization = await authorizationFor(
        OTHER_OWNER,
        'lifecycle-other-owner@example.com'
    );
    setupComplete = true;
});

beforeEach(async () => {
    await pool.query('delete from public.orders where id = any($1::text[])', [
        [ORDER_ID, SECOND_ORDER_ID],
    ]);
    await pool.query(
        `insert into public.orders
            (id, reference, user_id, partner_id, subtotal, delivery_fee,
             membership_fee, discount, tax, total, currency, pickup_slot_id,
             delivery_slot_id, payment_method, idempotency_key, placed_at)
         values
            ($1, 'LL-LIFECYCLE-001', $2, '1001', 10000, 0,
             0, 0, 1800, 11800, 'INR', $3, $4, 'cash_on_pickup',
             '77777777-7777-4777-8777-777777777777', now() + interval '2 hours'),
            ($5, 'LL-LIFECYCLE-002', $2, '1001', 5000, 0,
             0, 0, 900, 5900, 'INR', $3, $4, 'cash_on_pickup',
             '88888888-8888-4888-8888-888888888888', now() + interval '1 hour')`,
        [ORDER_ID, CUSTOMER, PICKUP_SLOT_ID, DELIVERY_SLOT_ID, SECOND_ORDER_ID]
    );
    await pool.query(
        `insert into public.order_items
            (order_id, item_id, name, unit, unit_price, quantity, line_total)
         values
            ($1, 'itm_1001_wf-shirt', 'Shirt / T-shirt', 'piece', 10000, 1, 10000),
            ($2, 'itm_1001_wf-shirt', 'Shirt / T-shirt', 'piece', 5000, 1, 5000)`,
        [ORDER_ID, SECOND_ORDER_ID]
    );
    await pool.query(
        `insert into public.order_addresses
            (order_id, label, recipient_name, phone, building, street, landmark, pincode)
         values
            ($1, 'Home', 'Lifecycle Customer', '+91 90000 00005', '12',
             'MG Road', null, '560103'),
            ($2, 'Home', 'Lifecycle Customer', '+91 90000 00005', '12',
             'MG Road', null, '560103')`,
        [ORDER_ID, SECOND_ORDER_ID]
    );
    await pool.query(
        `insert into public.order_events (order_id, type)
         values ($1, 'placed'), ($2, 'placed')`,
        [ORDER_ID, SECOND_ORDER_ID]
    );
});

afterAll(async () => {
    if (!setupComplete) {
        await pool.end();
        return;
    }
    await pool.query('delete from public.orders where id = any($1::text[])', [
        [ORDER_ID, SECOND_ORDER_ID],
    ]);
    await pool.query('delete from public.slots where id = any($1::text[])', [
        [PICKUP_SLOT_ID, DELIVERY_SLOT_ID],
    ]);
    await pool.query(
        `update public.partners set owner_id = null
         where (id = '1001' and owner_id = $1) or (id = '1002' and owner_id = $2)`,
        [OWNER, OTHER_OWNER]
    );
    await pool.query('delete from auth.users where id = any($1::uuid[])', [
        [CUSTOMER, OWNER, OTHER_OWNER],
    ]);
    await pool.end();
});

describe('partner order lifecycle', () => {
    it('provides an owner-only, filterable and cursor-paginated fulfilment queue', async () => {
        const anonymous = await get('/api/v1/partner/orders');
        expect(anonymous.status).toBe(401);

        const customer = await get('/api/v1/partner/orders', customerAuthorization);
        expect(customer.status).toBe(403);
        expect(customer.body).toMatchObject({ error: { code: 'FORBIDDEN' } });

        const first = await get(
            '/api/v1/partner/orders?partnerId=1001&status=processing&limit=1',
            ownerAuthorization
        );
        expect(first.status).toBe(200);
        expect(first.body as Page<PartnerOrderSummary>).toMatchObject({
            data: [
                {
                    id: ORDER_ID,
                    partner: { id: '1001' },
                    recipient: { name: 'Lifecycle Customer', pincode: '560103' },
                    itemCount: 1,
                    total: { amount: 11800, currency: 'INR' },
                    latestEvent: { type: 'placed' },
                },
            ],
            nextCursor: expect.any(String),
        });

        const cursor = (first.body as Page<PartnerOrderSummary>).nextCursor!;
        const second = await get(
            `/api/v1/partner/orders?partnerId=1001&status=processing&limit=1&cursor=${encodeURIComponent(cursor)}`,
            ownerAuthorization
        );
        expect(second.status).toBe(200);
        expect((second.body as Page<PartnerOrderSummary>).data[0]?.id).toBe(SECOND_ORDER_ID);

        const noDelivered = await get(
            '/api/v1/partner/orders?partnerId=1001&status=delivered',
            ownerAuthorization
        );
        expect(noDelivered.status).toBe(200);
        expect((noDelivered.body as Page<PartnerOrderSummary>).data).toEqual([]);

        const wrongLaundry = await get('/api/v1/partner/orders?partnerId=1002', ownerAuthorization);
        expect(wrongLaundry.status).toBe(404);
    });

    it('summarizes only the owner-scoped operational queue', async () => {
        const anonymous = await get('/api/v1/partner/orders/summary');
        expect(anonymous.status).toBe(401);

        const customer = await get('/api/v1/partner/orders/summary', customerAuthorization);
        expect(customer.status).toBe(403);

        const response = await get('/api/v1/partner/orders/summary', ownerAuthorization);
        expect(response.status).toBe(200);
        expect(response.body as PartnerOperationsSummary).toMatchObject({
            activeOrders: 2,
            awaitingConfirmation: 2,
            pickupsToday: 0,
            deliveriesToday: 0,
            completedToday: 0,
            generatedAt: expect.any(String),
        });

        const wrongLaundry = await get(
            '/api/v1/partner/orders/summary?partnerId=1002',
            ownerAuthorization
        );
        expect(wrongLaundry.status).toBe(404);
    });

    it('returns fulfilment detail only to the laundry that owns the order', async () => {
        const detail = await get(`/api/v1/partner/orders/${ORDER_ID}`, ownerAuthorization);
        expect(detail.status).toBe(200);
        expect(detail.body as Order).toMatchObject({
            id: ORDER_ID,
            deliveryAddress: {
                recipientName: 'Lifecycle Customer',
                phone: '+91 90000 00005',
                pincode: '560103',
            },
            events: [{ type: 'placed' }],
        });

        for (const authorization of [customerAuthorization, otherOwnerAuthorization]) {
            const hidden = await get(`/api/v1/partner/orders/${ORDER_ID}`, authorization);
            expect(hidden.status).toBe(404);
            expect(hidden.body).toMatchObject({ error: { code: 'NOT_FOUND' } });
        }
    });

    it('requires a session and hides the order from customers and other laundry owners', async () => {
        const anonymous = await request('POST', `/api/v1/partner/orders/${ORDER_ID}/events`, {
            type: 'confirmed',
        });
        expect(anonymous.status).toBe(401);

        for (const authorization of [customerAuthorization, otherOwnerAuthorization]) {
            const hidden = await request(
                'POST',
                `/api/v1/partner/orders/${ORDER_ID}/events`,
                { type: 'confirmed' },
                authorization
            );
            expect(hidden.status).toBe(404);
            expect(hidden.body).toMatchObject({ error: { code: 'NOT_FOUND' } });
        }
    });

    it('advances only through the ordered sequence and exposes each event to the customer', async () => {
        const sequence = [
            ['confirmed', 'processing'],
            ['picked_up', 'processing'],
            ['in_progress', 'processing'],
            ['out_for_delivery', 'out_for_delivery'],
            ['delivered', 'delivered'],
        ] as const;

        for (const [type, status] of sequence) {
            const advanced = await request(
                'POST',
                `/api/v1/partner/orders/${ORDER_ID}/events`,
                { type },
                ownerAuthorization
            );
            expect(advanced.status).toBe(201);
            expect(advanced.body).toMatchObject({
                orderId: ORDER_ID,
                status,
                event: { type, occurredAt: expect.any(String) },
            });
        }

        const response = await get(`/api/v1/orders/${ORDER_ID}`, customerAuthorization);
        expect(response.status).toBe(200);
        expect(response.body as Order).toMatchObject({
            status: 'delivered',
            events: sequence
                .map(([type]) => ({ type }))
                .reduce<Array<{ type: string }>>(
                    (events, event) => [...events, event],
                    [{ type: 'placed' }]
                ),
        });

        const terminal = await request(
            'POST',
            `/api/v1/partner/orders/${ORDER_ID}/events`,
            { type: 'delivered' },
            ownerAuthorization
        );
        expect(terminal.status).toBe(409);
        expect(terminal.body).toMatchObject({ error: { code: 'INVALID_ORDER_TRANSITION' } });
    });

    it('rejects skipped and concurrent repeated transitions without partial writes', async () => {
        const skipped = await request(
            'POST',
            `/api/v1/partner/orders/${ORDER_ID}/events`,
            { type: 'picked_up' },
            ownerAuthorization
        );
        expect(skipped.status).toBe(409);
        expect(skipped.body).toMatchObject({ error: { code: 'INVALID_ORDER_TRANSITION' } });

        const attempts = await Promise.all([
            request(
                'POST',
                `/api/v1/partner/orders/${ORDER_ID}/events`,
                { type: 'confirmed' },
                ownerAuthorization
            ),
            request(
                'POST',
                `/api/v1/partner/orders/${ORDER_ID}/events`,
                { type: 'confirmed' },
                ownerAuthorization
            ),
        ]);
        expect(attempts.map(({ status }) => status).sort()).toEqual([201, 409]);

        const events = await pool.query<{ type: string }>(
            'select type from public.order_events where order_id = $1 order by occurred_at, id',
            [ORDER_ID]
        );
        expect(events.rows).toEqual([{ type: 'placed' }, { type: 'confirmed' }]);
    });

    it('keeps direct order and event table writes unavailable to an owner session', async () => {
        await expect(
            asCaller(pool, OWNER, (client) =>
                client.query("update public.orders set status = 'delivered' where id = $1", [
                    ORDER_ID,
                ])
            )
        ).rejects.toThrow(/permission denied/i);

        await expect(
            asCaller(pool, OWNER, (client) =>
                client.query(
                    "insert into public.order_events (order_id, type) values ($1, 'delivered')",
                    [ORDER_ID]
                )
            )
        ).rejects.toThrow(/permission denied/i);
    });
});
