import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { SignJWT } from 'jose';
import { asCaller } from '../src/db/pool.js';
import type { Order } from '../src/models.js';
import { get, pool, request, requireDatabase } from './helpers.js';

const CUSTOMER = 'eeeeeeee-0000-4000-8000-000000000017';
const OTHER_CUSTOMER = 'eeeeeeee-0000-4000-8000-000000000018';
const OWNER = 'eeeeeeee-0000-4000-8000-000000000019';
const PARTNER_ID = 'ptr_test_rescheduling';
const ORDER_ID = 'ord_test_rescheduling';
const OLD_PICKUP = 'slt_test_rescheduling_old_pickup';
const OLD_DELIVERY = 'slt_test_rescheduling_old_delivery';
const NEW_PICKUP = 'slt_test_rescheduling_new_pickup';
const NEW_DELIVERY = 'slt_test_rescheduling_new_delivery';
const FULL_PICKUP = 'slt_test_rescheduling_full_pickup';
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
let otherAuthorization: Record<string, string>;
let ownerAuthorization: Record<string, string>;
let setupComplete = false;

beforeAll(async () => {
    await requireDatabase();
    await pool.query(
        `insert into auth.users (id, email, raw_user_meta_data)
         values ($1, 'rescheduling-customer@example.com', '{"full_name":"Schedule Customer"}'),
                ($2, 'rescheduling-other@example.com', '{"full_name":"Other Customer"}'),
                ($3, 'rescheduling-owner@example.com', '{"full_name":"Schedule Owner"}')
         on conflict (id) do nothing`,
        [CUSTOMER, OTHER_CUSTOMER, OWNER]
    );
    await pool.query(
        `insert into public.partners
            (id, owner_id, name, line1, city, pincode, turnaround_hours)
         values ($1, $2, 'Schedule Laundry', '12 Test Street',
                 'Bengaluru', '560103', 24)
         on conflict (id) do nothing`,
        [PARTNER_ID, OWNER]
    );
    await pool.query(
        `insert into public.partner_service_areas (partner_id, pincode)
         values ($1, '560103') on conflict do nothing`,
        [PARTNER_ID]
    );
    customerAuthorization = await authorizationFor(CUSTOMER, 'rescheduling-customer@example.com');
    otherAuthorization = await authorizationFor(OTHER_CUSTOMER, 'rescheduling-other@example.com');
    ownerAuthorization = await authorizationFor(OWNER, 'rescheduling-owner@example.com');
    setupComplete = true;
});

beforeEach(async () => {
    await pool.query('delete from public.orders where id = $1', [ORDER_ID]);
    await pool.query('delete from public.slots where id = any($1::text[])', [
        [OLD_PICKUP, OLD_DELIVERY, NEW_PICKUP, NEW_DELIVERY, FULL_PICKUP],
    ]);
    await pool.query(
        `insert into public.slots
            (id, partner_id, starts_at, ends_at, capacity, booked, state)
         values
            ($1, $6, now() + interval '40 days', now() + interval '40 days 2 hours', 1, 1, 'full'),
            ($2, $6, now() + interval '40 days 4 hours', now() + interval '40 days 6 hours', 1, 1, 'full'),
            ($3, $6, now() + interval '41 days', now() + interval '41 days 2 hours', 1, 0, 'open'),
            ($4, $6, now() + interval '41 days 4 hours', now() + interval '41 days 6 hours', 1, 0, 'open'),
            ($5, $6, now() + interval '42 days', now() + interval '42 days 2 hours', 1, 1, 'full')`,
        [OLD_PICKUP, OLD_DELIVERY, NEW_PICKUP, NEW_DELIVERY, FULL_PICKUP, PARTNER_ID]
    );
    await pool.query(
        `insert into public.orders
            (id, reference, user_id, partner_id, subtotal, delivery_fee,
             membership_fee, discount, tax, total, currency, pickup_slot_id,
             delivery_slot_id, payment_method, idempotency_key)
         values
            ($1, 'LL-RESCHEDULE-001', $2, $3, 10000, 0, 9900, 1000, 3402, 22302,
             'INR', $4, $5, 'cash_on_pickup',
             'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')`,
        [ORDER_ID, CUSTOMER, PARTNER_ID, OLD_PICKUP, OLD_DELIVERY]
    );
    await pool.query(
        `insert into public.order_items
            (order_id, item_id, name, unit, unit_price, quantity, line_total)
         values ($1, 'itm_reschedule_test', 'Shirt', 'piece', 10000, 1, 10000)`,
        [ORDER_ID]
    );
    await pool.query(
        `insert into public.order_addresses
            (order_id, label, recipient_name, phone, building, street, pincode)
         values ($1, 'Home', 'Schedule Customer', '+91 90000 00017',
                 '12', 'Test Street', '560103')`,
        [ORDER_ID]
    );
    await pool.query("insert into public.order_events (order_id, type) values ($1, 'placed')", [
        ORDER_ID,
    ]);
});

afterAll(async () => {
    if (!setupComplete) {
        await pool.end();
        return;
    }
    await pool.query('delete from public.orders where id = $1', [ORDER_ID]);
    await pool.query('delete from public.slots where id = any($1::text[])', [
        [OLD_PICKUP, OLD_DELIVERY, NEW_PICKUP, NEW_DELIVERY, FULL_PICKUP],
    ]);
    await pool.query('delete from public.partners where id = $1', [PARTNER_ID]);
    await pool.query('delete from auth.users where id = any($1::uuid[])', [
        [CUSTOMER, OTHER_CUSTOMER, OWNER],
    ]);
    await pool.end();
});

describe('customer order rescheduling', () => {
    it('requires the customer session and conceals another customer order', async () => {
        const payload = { pickupSlotId: NEW_PICKUP, deliverySlotId: NEW_DELIVERY };
        const anonymous = await request('POST', `/api/v1/orders/${ORDER_ID}/rescheduling`, payload);
        expect(anonymous.status).toBe(401);

        const other = await request(
            'POST',
            `/api/v1/orders/${ORDER_ID}/rescheduling`,
            payload,
            otherAuthorization
        );
        expect(other.status).toBe(404);
    });

    it('moves reservations atomically, records before/after slots and preserves fulfilment', async () => {
        const response = await request(
            'POST',
            `/api/v1/orders/${ORDER_ID}/rescheduling`,
            { pickupSlotId: NEW_PICKUP, deliverySlotId: NEW_DELIVERY },
            customerAuthorization
        );
        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            orderId: ORDER_ID,
            rescheduledAt: expect.any(String),
        });

        const order = await get(`/api/v1/orders/${ORDER_ID}`, customerAuthorization);
        expect(order.status).toBe(200);
        expect(order.body as Order).toMatchObject({
            canCancel: false,
            canReschedule: true,
            pickup: { startsAt: expect.any(String) },
            delivery: { startsAt: expect.any(String) },
            events: [{ type: 'placed' }],
            reschedules: [
                {
                    occurredAt: expect.any(String),
                    previous: {
                        pickup: { startsAt: expect.any(String) },
                        delivery: { startsAt: expect.any(String) },
                    },
                    updated: {
                        pickup: { startsAt: expect.any(String) },
                        delivery: { startsAt: expect.any(String) },
                    },
                },
            ],
        });

        const slots = await pool.query<{ id: string; booked: number; state: string }>(
            `select id, booked, state from public.slots
             where id = any($1::text[]) order by id`,
            [[OLD_PICKUP, OLD_DELIVERY, NEW_PICKUP, NEW_DELIVERY]]
        );
        expect(Object.fromEntries(slots.rows.map(({ id, ...slot }) => [id, slot]))).toEqual({
            [NEW_DELIVERY]: { booked: 1, state: 'full' },
            [NEW_PICKUP]: { booked: 1, state: 'full' },
            [OLD_DELIVERY]: { booked: 0, state: 'open' },
            [OLD_PICKUP]: { booked: 0, state: 'open' },
        });

        const advanced = await request(
            'POST',
            `/api/v1/partner/orders/${ORDER_ID}/events`,
            { type: 'confirmed' },
            ownerAuthorization
        );
        expect(advanced.status).toBe(201);
        expect(advanced.body).toMatchObject({ event: { type: 'confirmed' } });

        await pool.query('update public.orders set membership_fee = 0 where id = $1', [ORDER_ID]);
        const cancelled = await request(
            'POST',
            `/api/v1/orders/${ORDER_ID}/cancellation`,
            undefined,
            customerAuthorization
        );
        expect(cancelled.status).toBe(200);
        const released = await pool.query<{ booked: number }>(
            'select booked from public.slots where id = any($1::text[]) order by id',
            [[NEW_PICKUP, NEW_DELIVERY]]
        );
        expect(released.rows).toEqual([{ booked: 0 }, { booked: 0 }]);
    });

    it('rejects unavailable or pickup-stage changes without releasing the current slots', async () => {
        const unavailable = await request(
            'POST',
            `/api/v1/orders/${ORDER_ID}/rescheduling`,
            { pickupSlotId: FULL_PICKUP, deliverySlotId: NEW_DELIVERY },
            customerAuthorization
        );
        expect(unavailable.status).toBe(409);
        expect(unavailable.body).toMatchObject({ error: { code: 'SLOT_UNAVAILABLE' } });

        const foreignSlot = await pool.query<{ id: string }>(
            `select id from public.slots
             where partner_id = '1001' and starts_at > now()
             order by starts_at limit 1`
        );
        const otherLaundry = await request(
            'POST',
            `/api/v1/orders/${ORDER_ID}/rescheduling`,
            { pickupSlotId: foreignSlot.rows[0]!.id, deliverySlotId: NEW_DELIVERY },
            customerAuthorization
        );
        expect(otherLaundry.status).toBe(409);
        expect(otherLaundry.body).toMatchObject({ error: { code: 'SLOT_UNAVAILABLE' } });

        await pool.query(
            "insert into public.order_events (order_id, type) values ($1, 'confirmed'), ($1, 'picked_up')",
            [ORDER_ID]
        );
        const tooLate = await request(
            'POST',
            `/api/v1/orders/${ORDER_ID}/rescheduling`,
            { pickupSlotId: NEW_PICKUP, deliverySlotId: NEW_DELIVERY },
            customerAuthorization
        );
        expect(tooLate.status).toBe(409);
        expect(tooLate.body).toMatchObject({ error: { code: 'RESCHEDULING_NOT_ALLOWED' } });

        const slots = await pool.query<{ booked: number }>(
            `select booked from public.slots
             where id = any($1::text[]) order by id`,
            [[OLD_PICKUP, OLD_DELIVERY, NEW_PICKUP, NEW_DELIVERY]]
        );
        expect(slots.rows.map(({ booked }) => booked).sort()).toEqual([0, 0, 1, 1]);
    });

    it('serializes repeated requests and keeps the audit records immutable to callers', async () => {
        const payload = { pickupSlotId: NEW_PICKUP, deliverySlotId: NEW_DELIVERY };
        const attempts = await Promise.all([
            request(
                'POST',
                `/api/v1/orders/${ORDER_ID}/rescheduling`,
                payload,
                customerAuthorization
            ),
            request(
                'POST',
                `/api/v1/orders/${ORDER_ID}/rescheduling`,
                payload,
                customerAuthorization
            ),
        ]);
        expect(attempts.map(({ status }) => status).sort()).toEqual([200, 409]);

        const audit = await pool.query<{ count: string; actor_user_id: string }>(
            `select count(*)::text as count, min(actor_user_id::text) as actor_user_id
             from public.order_reschedules where order_id = $1`,
            [ORDER_ID]
        );
        expect(audit.rows[0]).toEqual({ count: '1', actor_user_id: CUSTOMER });

        await expect(
            asCaller(pool, CUSTOMER, (client) =>
                client.query('delete from public.order_reschedules where order_id = $1', [ORDER_ID])
            )
        ).rejects.toThrow(/permission denied/i);
    });
});
