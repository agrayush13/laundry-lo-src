import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { SignJWT } from 'jose';
import type { Order } from '../src/models.js';
import { get, pool, request, requireDatabase } from './helpers.js';

const CUSTOMER = 'eeeeeeee-0000-4000-8000-000000000014';
const OTHER_CUSTOMER = 'eeeeeeee-0000-4000-8000-000000000015';
const OWNER = 'eeeeeeee-0000-4000-8000-000000000016';
const PARTNER_ID = 'ptr_test_cancellation';
const ORDER_ID = 'ord_test_cancellation';
const PICKUP_SLOT_ID = 'slt_test_cancellation_pickup';
const DELIVERY_SLOT_ID = 'slt_test_cancellation_delivery';
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
let setupComplete = false;

beforeAll(async () => {
    await requireDatabase();
    await pool.query(
        `insert into auth.users (id, email, raw_user_meta_data)
         values ($1, 'cancellation-customer@example.com', '{"full_name":"Cancellation Customer"}'),
                ($2, 'cancellation-other@example.com', '{"full_name":"Other Customer"}'),
                ($3, 'cancellation-owner@example.com', '{"full_name":"Cancellation Owner"}')
         on conflict (id) do nothing`,
        [CUSTOMER, OTHER_CUSTOMER, OWNER]
    );
    await pool.query(
        `insert into public.partners
            (id, owner_id, name, line1, city, pincode, turnaround_hours)
         values ($1, $2, 'Cancellation Laundry', '12 Test Street',
                 'Bengaluru', '560103', 24)
         on conflict (id) do nothing`,
        [PARTNER_ID, OWNER]
    );
    await pool.query(
        `insert into public.partner_service_areas (partner_id, pincode)
         values ($1, '560103') on conflict do nothing`,
        [PARTNER_ID]
    );
    customerAuthorization = await authorizationFor(CUSTOMER, 'cancellation-customer@example.com');
    otherAuthorization = await authorizationFor(OTHER_CUSTOMER, 'cancellation-other@example.com');
    setupComplete = true;
});

beforeEach(async () => {
    await pool.query('delete from public.orders where id = $1', [ORDER_ID]);
    await pool.query('delete from public.slots where id = any($1::text[])', [
        [PICKUP_SLOT_ID, DELIVERY_SLOT_ID],
    ]);
    await pool.query(
        `insert into public.slots
            (id, partner_id, starts_at, ends_at, capacity, booked, state)
         values
            ($1, $3, now() + interval '40 days', now() + interval '40 days 2 hours',
             1, 1, 'full'),
            ($2, $3, now() + interval '40 days 4 hours', now() + interval '40 days 6 hours',
             1, 1, 'full')`,
        [PICKUP_SLOT_ID, DELIVERY_SLOT_ID, PARTNER_ID]
    );
    await pool.query(
        `insert into public.orders
            (id, reference, user_id, partner_id, subtotal, delivery_fee,
             membership_fee, discount, tax, total, currency, pickup_slot_id,
             delivery_slot_id, payment_method, idempotency_key)
         values
            ($1, 'LL-CANCEL-001', $2, $3, 10000, 0, 0, 0, 1800, 11800,
             'INR', $4, $5, 'cash_on_pickup',
             '99999999-9999-4999-8999-999999999999')`,
        [ORDER_ID, CUSTOMER, PARTNER_ID, PICKUP_SLOT_ID, DELIVERY_SLOT_ID]
    );
    await pool.query(
        `insert into public.order_items
            (order_id, item_id, name, unit, unit_price, quantity, line_total)
         values ($1, 'itm_cancel_test', 'Shirt', 'piece', 10000, 1, 10000)`,
        [ORDER_ID]
    );
    await pool.query(
        `insert into public.order_addresses
            (order_id, label, recipient_name, phone, building, street, pincode)
         values ($1, 'Home', 'Cancellation Customer', '+91 90000 00014',
                 '12', 'Test Street', '560103')`,
        [ORDER_ID]
    );
    await pool.query(
        `insert into public.order_events (order_id, type)
         values ($1, 'placed')`,
        [ORDER_ID]
    );
});

afterAll(async () => {
    if (!setupComplete) {
        await pool.end();
        return;
    }
    await pool.query('delete from public.orders where id = $1', [ORDER_ID]);
    await pool.query('delete from public.slots where id = any($1::text[])', [
        [PICKUP_SLOT_ID, DELIVERY_SLOT_ID],
    ]);
    await pool.query('delete from public.partners where id = $1', [PARTNER_ID]);
    await pool.query('delete from auth.users where id = any($1::uuid[])', [
        [CUSTOMER, OTHER_CUSTOMER, OWNER],
    ]);
    await pool.end();
});

describe('customer order cancellation', () => {
    it('requires the customer session and conceals another customer order', async () => {
        const anonymous = await request('POST', `/api/v1/orders/${ORDER_ID}/cancellation`);
        expect(anonymous.status).toBe(401);

        const other = await request(
            'POST',
            `/api/v1/orders/${ORDER_ID}/cancellation`,
            undefined,
            otherAuthorization
        );
        expect(other.status).toBe(404);
        expect(other.body).toMatchObject({ error: { code: 'NOT_FOUND' } });
    });

    it('releases both reservations without reopening a blocked slot', async () => {
        await pool.query(
            `insert into public.order_events (order_id, type)
             values ($1, 'confirmed')`,
            [ORDER_ID]
        );
        await pool.query("update public.slots set state = 'blocked' where id = $1", [
            DELIVERY_SLOT_ID,
        ]);

        const response = await request(
            'POST',
            `/api/v1/orders/${ORDER_ID}/cancellation`,
            undefined,
            customerAuthorization
        );
        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            orderId: ORDER_ID,
            status: 'cancelled',
            event: { type: 'cancelled', occurredAt: expect.any(String) },
        });

        const order = await get(`/api/v1/orders/${ORDER_ID}`, customerAuthorization);
        expect(order.status).toBe(200);
        expect(order.body as Order).toMatchObject({
            status: 'cancelled',
            canCancel: false,
            events: [{ type: 'placed' }, { type: 'confirmed' }, { type: 'cancelled' }],
        });
        const slots = await pool.query<{ booked: number; state: string }>(
            `select booked, state from public.slots
             where id = any($1::text[]) order by id`,
            [[PICKUP_SLOT_ID, DELIVERY_SLOT_ID]]
        );
        expect(slots.rows).toEqual([
            { booked: 0, state: 'blocked' },
            { booked: 0, state: 'open' },
        ]);
    });

    it('exposes an authoritative cancellation capability on customer reads', async () => {
        const eligible = await get(`/api/v1/orders/${ORDER_ID}`, customerAuthorization);
        expect(eligible.body).toMatchObject({ canCancel: true });

        await pool.query('update public.orders set membership_fee = 9900 where id = $1', [
            ORDER_ID,
        ]);
        const plusOrder = await get(`/api/v1/orders/${ORDER_ID}`, customerAuthorization);
        expect(plusOrder.body).toMatchObject({ canCancel: false });

        await pool.query('update public.orders set membership_fee = 0 where id = $1', [ORDER_ID]);
        await pool.query(
            `insert into public.order_events (order_id, type)
             values ($1, 'confirmed'), ($1, 'picked_up')`,
            [ORDER_ID]
        );
        const pickedUp = await get(`/api/v1/orders/${ORDER_ID}`, customerAuthorization);
        expect(pickedUp.body).toMatchObject({ canCancel: false });
    });

    it('rejects pickup-stage, elapsed and Plus-activation cancellations atomically', async () => {
        const assertRejected = async () => {
            const response = await request(
                'POST',
                `/api/v1/orders/${ORDER_ID}/cancellation`,
                undefined,
                customerAuthorization
            );
            expect(response.status).toBe(409);
            expect(response.body).toMatchObject({
                error: { code: 'CANCELLATION_NOT_ALLOWED' },
            });
            const stored = await pool.query<{ status: string; cancelled_events: number }>(
                `select o.status,
                        count(e.id) filter (where e.type = 'cancelled')::integer as cancelled_events
                 from public.orders o
                 left join public.order_events e on e.order_id = o.id
                 where o.id = $1 group by o.id`,
                [ORDER_ID]
            );
            expect(stored.rows[0]).toEqual({ status: 'processing', cancelled_events: 0 });
        };

        await pool.query(
            `insert into public.order_events (order_id, type)
             values ($1, 'confirmed'), ($1, 'picked_up')`,
            [ORDER_ID]
        );
        await assertRejected();

        await pool.query(
            "delete from public.order_events where order_id = $1 and type <> 'placed'",
            [ORDER_ID]
        );
        await pool.query(
            `update public.slots set starts_at = now() - interval '1 hour' where id = $1`,
            [PICKUP_SLOT_ID]
        );
        await assertRejected();

        await pool.query(
            `update public.slots set starts_at = now() + interval '40 days' where id = $1`,
            [PICKUP_SLOT_ID]
        );
        await pool.query('update public.orders set membership_fee = 9900 where id = $1', [
            ORDER_ID,
        ]);
        await assertRejected();

        const slots = await pool.query<{ booked: number; state: string }>(
            `select booked, state from public.slots
             where id = any($1::text[]) order by id`,
            [[PICKUP_SLOT_ID, DELIVERY_SLOT_ID]]
        );
        expect(slots.rows).toEqual([
            { booked: 1, state: 'full' },
            { booked: 1, state: 'full' },
        ]);
    });

    it('serializes repeated cancellation attempts without releasing capacity twice', async () => {
        const attempts = await Promise.all([
            request(
                'POST',
                `/api/v1/orders/${ORDER_ID}/cancellation`,
                undefined,
                customerAuthorization
            ),
            request(
                'POST',
                `/api/v1/orders/${ORDER_ID}/cancellation`,
                undefined,
                customerAuthorization
            ),
        ]);
        expect(attempts.map(({ status }) => status).sort()).toEqual([200, 409]);

        const events = await pool.query<{ type: string }>(
            `select type from public.order_events
             where order_id = $1 order by occurred_at, id`,
            [ORDER_ID]
        );
        expect(events.rows).toEqual([{ type: 'placed' }, { type: 'cancelled' }]);
        const slots = await pool.query<{ booked: number }>(
            `select booked from public.slots
             where id = any($1::text[]) order by id`,
            [[PICKUP_SLOT_ID, DELIVERY_SLOT_ID]]
        );
        expect(slots.rows).toEqual([{ booked: 0 }, { booked: 0 }]);
    });
});
