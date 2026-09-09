import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { SignJWT } from 'jose';
import { asCaller } from '../src/db/pool.js';
import type { OpeningHours, PartnerConfiguration } from '../src/models.js';
import { get, pool, request, requireDatabase } from './helpers.js';

const OWNER = 'eeeeeeee-0000-4000-8000-000000000008';
const OTHER_OWNER = 'eeeeeeee-0000-4000-8000-000000000009';
const CUSTOMER = 'eeeeeeee-0000-4000-8000-000000000010';
const PARTNER_ID = 'ptr_test_configuration';
const UNBOOKED_SLOT_ID = 'slt_test_configuration_unbooked';
const BOOKED_SLOT_ID = 'slt_test_configuration_booked';
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

const regularHours: OpeningHours[] = Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    opensAt: '08:00',
    closesAt: '20:00',
}));

const input = (overrides: Partial<Omit<PartnerConfiguration, 'id' | 'currentlyOpen'>> = {}) => ({
    name: 'Configuration Laundry',
    about: 'Owner-managed test laundry.',
    address: {
        line1: '12 Test Street',
        line2: 'First floor',
        city: 'Bengaluru',
        pincode: '560103',
    },
    servicePincodes: ['560103'],
    holidayClosures: [],
    capacityOverrides: [],
    turnaroundHours: 24,
    acceptingOrders: true,
    useOpeningHours: true,
    openingHours: regularHours,
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
         values ($1, 'configuration-owner@example.com', '{"full_name":"Configuration Owner"}'),
                ($2, 'configuration-other@example.com', '{"full_name":"Other Owner"}'),
                ($3, 'configuration-customer@example.com', '{"full_name":"Customer"}')
         on conflict (id) do nothing`,
        [OWNER, OTHER_OWNER, CUSTOMER]
    );
    await pool.query(
        `insert into public.partners
            (id, owner_id, name, about, line1, line2, city, pincode,
             turnaround_hours, is_open, auto_schedule)
         values ($1, $2, 'Configuration Laundry', 'Owner-managed test laundry.',
                 '12 Test Street', 'First floor', 'Bengaluru', '560103', 24, true, true)
         on conflict (id) do nothing`,
        [PARTNER_ID, OWNER]
    );
    await pool.query(
        `insert into public.partner_service_areas (partner_id, pincode)
         values ($1, '560103') on conflict do nothing`,
        [PARTNER_ID]
    );
    ownerAuthorization = await authorizationFor(OWNER, 'configuration-owner@example.com');
    otherOwnerAuthorization = await authorizationFor(
        OTHER_OWNER,
        'configuration-other@example.com'
    );
    customerAuthorization = await authorizationFor(CUSTOMER, 'configuration-customer@example.com');
    setupComplete = true;
});

beforeEach(async () => {
    await pool.query('delete from public.slots where partner_id = $1', [PARTNER_ID]);
    await pool.query('delete from public.partner_holiday_closures where partner_id = $1', [
        PARTNER_ID,
    ]);
    await pool.query('delete from public.partner_capacity_overrides where partner_id = $1', [
        PARTNER_ID,
    ]);
    await pool.query('delete from public.partner_hours where partner_id = $1', [PARTNER_ID]);
    await pool.query(
        `insert into public.partner_hours (partner_id, weekday, opens_at, closes_at)
         select $1, weekday, '08:00'::time, '20:00'::time
         from generate_series(0, 6) as weekday`,
        [PARTNER_ID]
    );
    await pool.query(
        `update public.partners
         set owner_id = $2, name = 'Configuration Laundry',
             about = 'Owner-managed test laundry.', line1 = '12 Test Street',
             line2 = 'First floor', city = 'Bengaluru', pincode = '560103',
             turnaround_hours = 24, is_open = true, auto_schedule = true
         where id = $1`,
        [PARTNER_ID, OWNER]
    );
    await pool.query('delete from public.partner_service_areas where partner_id = $1', [
        PARTNER_ID,
    ]);
    await pool.query(
        `insert into public.partner_service_areas (partner_id, pincode) values ($1, '560103')`,
        [PARTNER_ID]
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

describe('partner laundry configuration', () => {
    it('lists configuration only for a laundry owner', async () => {
        const anonymous = await get('/api/v1/partner/laundries');
        expect(anonymous.status).toBe(401);

        const customer = await get('/api/v1/partner/laundries', customerAuthorization);
        expect(customer.status).toBe(403);
        expect(customer.body).toMatchObject({ error: { code: 'FORBIDDEN' } });

        const owner = await get('/api/v1/partner/laundries', ownerAuthorization);
        expect(owner.status).toBe(200);
        expect(owner.body).toMatchObject({
            data: [
                {
                    id: PARTNER_ID,
                    name: 'Configuration Laundry',
                    address: { pincode: '560103' },
                    servicePincodes: ['560103'],
                    holidayClosures: [],
                    capacityOverrides: [],
                    acceptingOrders: true,
                    useOpeningHours: true,
                    currentlyOpen: expect.any(Boolean),
                    openingHours: regularHours,
                },
            ],
        });
    });

    it('hides another laundry from reads and writes', async () => {
        for (const authorization of [otherOwnerAuthorization, customerAuthorization]) {
            const read = await get(`/api/v1/partner/laundries/${PARTNER_ID}`, authorization);
            expect(read.status).toBe(404);

            const write = await request(
                'PUT',
                `/api/v1/partner/laundries/${PARTNER_ID}`,
                input(),
                authorization
            );
            expect(write.status).toBe(404);
            expect(write.body).toMatchObject({ error: { code: 'NOT_FOUND' } });
        }
    });

    it('updates the public profile, multiple service areas, controls and weekly schedule', async () => {
        const closedHours = regularHours.map((hour) =>
            hour.weekday === 0 ? { weekday: 0, opensAt: null, closesAt: null } : hour
        );
        const response = await request(
            'PUT',
            `/api/v1/partner/laundries/${PARTNER_ID}`,
            input({
                name: 'Freshly Configured Laundry',
                about: 'Updated by its owner.',
                address: {
                    line1: '42 New Road',
                    line2: '',
                    city: 'Bengaluru',
                    pincode: '560001',
                },
                servicePincodes: ['560102', '560104'],
                holidayClosures: [{ date: '2099-12-24', reason: 'Public holiday' }],
                capacityOverrides: [{ date: '2099-12-26', capacity: 12, note: 'Festival demand' }],
                turnaroundHours: 36,
                acceptingOrders: false,
                openingHours: closedHours,
            }),
            ownerAuthorization
        );

        expect(response.status).toBe(200);
        expect(response.body as PartnerConfiguration).toMatchObject({
            id: PARTNER_ID,
            name: 'Freshly Configured Laundry',
            about: 'Updated by its owner.',
            address: { line1: '42 New Road', line2: '', pincode: '560001' },
            servicePincodes: ['560102', '560104'],
            holidayClosures: [{ date: '2099-12-24', reason: 'Public holiday' }],
            capacityOverrides: [{ date: '2099-12-26', capacity: 12, note: 'Festival demand' }],
            turnaroundHours: 36,
            acceptingOrders: false,
            useOpeningHours: true,
            currentlyOpen: false,
            openingHours: closedHours,
        });

        const publicDetail = await get(`/api/v1/partners/${PARTNER_ID}`);
        expect(publicDetail.status).toBe(200);
        expect(publicDetail.body).toMatchObject({
            name: 'Freshly Configured Laundry',
            about: 'Updated by its owner.',
            address: { pincode: '560001' },
            turnaroundHours: 36,
            isOpen: false,
            openingHours: closedHours,
        });

        for (const pincode of ['560102', '560104']) {
            const covered = await get(`/api/v1/partners?pincode=${pincode}`);
            expect(
                (covered.body as { data: Array<{ id: string }> }).data.some(
                    ({ id }) => id === PARTNER_ID
                )
            ).toBe(true);
        }
        const physicalOnly = await get('/api/v1/partners?pincode=560001');
        expect(
            (physicalOnly.body as { data: Array<{ id: string }> }).data.some(
                ({ id }) => id === PARTNER_ID
            )
        ).toBe(false);
    });

    it('rejects incomplete, duplicate, invalid and overnight schedules atomically', async () => {
        const invalidBodies = [
            input({ openingHours: regularHours.slice(0, 6) }),
            input({ openingHours: regularHours.map((hour) => ({ ...hour, weekday: 0 })) }),
            input({
                openingHours: regularHours.map((hour) =>
                    hour.weekday === 2 ? { ...hour, opensAt: '20:00', closesAt: '08:00' } : hour
                ),
            }),
            input({ address: { ...input().address, pincode: '5600' } }),
            input({ servicePincodes: [] }),
            input({ servicePincodes: ['560102', '560102'] }),
            input({ servicePincodes: ['56010x'] }),
            input({ holidayClosures: [{ date: '2000-01-01', reason: '' }] }),
            input({ holidayClosures: [{ date: '2099-02-29', reason: '' }] }),
            input({ capacityOverrides: [{ date: '2000-01-01', capacity: 8, note: '' }] }),
            input({ capacityOverrides: [{ date: '2099-12-26', capacity: 0, note: '' }] }),
            input({ capacityOverrides: [{ date: '2099-12-26', capacity: 101, note: '' }] }),
            input({ capacityOverrides: [{ date: '2099-02-29', capacity: 8, note: '' }] }),
            input({
                holidayClosures: [
                    { date: '2099-12-24', reason: '' },
                    { date: '2099-12-24', reason: 'Duplicate' },
                ],
            }),
            input({
                capacityOverrides: [
                    { date: '2099-12-26', capacity: 8, note: '' },
                    { date: '2099-12-26', capacity: 12, note: 'Duplicate' },
                ],
            }),
        ];

        for (const body of invalidBodies) {
            const response = await request(
                'PUT',
                `/api/v1/partner/laundries/${PARTNER_ID}`,
                body,
                ownerAuthorization
            );
            expect(response.status).toBe(422);
            expect(response.body).toMatchObject({ error: { code: 'VALIDATION_FAILED' } });
        }

        const stored = await pool.query<{ name: string; pincode: string }>(
            'select name, pincode from public.partners where id = $1',
            [PARTNER_ID]
        );
        expect(stored.rows[0]).toEqual({ name: 'Configuration Laundry', pincode: '560103' });
        const serviceAreas = await pool.query<{ pincode: string }>(
            'select pincode from public.partner_service_areas where partner_id = $1',
            [PARTNER_ID]
        );
        expect(serviceAreas.rows).toEqual([{ pincode: '560103' }]);
    });

    it('preserves booked capacity for an unchanged schedule', async () => {
        await pool.query(
            `insert into public.slots
                (id, partner_id, starts_at, ends_at, capacity, booked, state)
             values ($1, $2, now() + interval '40 days', now() + interval '40 days 2 hours',
                     8, 1, 'open')`,
            [BOOKED_SLOT_ID, PARTNER_ID]
        );

        const response = await request(
            'PUT',
            `/api/v1/partner/laundries/${PARTNER_ID}`,
            input(),
            ownerAuthorization
        );
        expect(response.status).toBe(200);

        const slot = await pool.query<{ state: string; booked: number }>(
            'select state, booked from public.slots where id = $1',
            [BOOKED_SLOT_ID]
        );
        expect(slot.rows[0]).toEqual({ state: 'open', booked: 1 });
    });

    it('changes per-date capacity without dropping or overbooking existing orders', async () => {
        const dateResult = await pool.query<{ date: string }>(
            `select to_char(timezone('Asia/Kolkata', now())::date + 7, 'YYYY-MM-DD') as date`
        );
        const capacityDate = dateResult.rows[0]!.date;
        await pool.query(
            `insert into public.slots
                (id, partner_id, starts_at, ends_at, capacity, booked, state)
             values
                ($1, $3,
                 timezone('Asia/Kolkata', ($4::date + time '08:00')::timestamp),
                 timezone('Asia/Kolkata', ($4::date + time '10:00')::timestamp),
                 8, 3, 'open'),
                ($2, $3,
                 timezone('Asia/Kolkata', ($4::date + time '10:00')::timestamp),
                 timezone('Asia/Kolkata', ($4::date + time '12:00')::timestamp),
                 8, 4, 'open')`,
            [UNBOOKED_SLOT_ID, BOOKED_SLOT_ID, PARTNER_ID, capacityDate]
        );

        const changed = await request(
            'PUT',
            `/api/v1/partner/laundries/${PARTNER_ID}`,
            input({
                capacityOverrides: [{ date: capacityDate, capacity: 4, note: 'Reduced team' }],
            }),
            ownerAuthorization
        );
        expect(changed.status).toBe(200);
        expect(changed.body).toMatchObject({
            capacityOverrides: [{ date: capacityDate, capacity: 4, note: 'Reduced team' }],
        });
        const limited = await pool.query<{
            id: string;
            capacity: number;
            booked: number;
            state: string;
        }>(
            `select id, capacity, booked, state from public.slots
             where id = any($1::text[]) order by id`,
            [[UNBOOKED_SLOT_ID, BOOKED_SLOT_ID]]
        );
        expect(limited.rows).toEqual([
            { id: BOOKED_SLOT_ID, capacity: 4, booked: 4, state: 'full' },
            { id: UNBOOKED_SLOT_ID, capacity: 4, booked: 3, state: 'open' },
        ]);

        const tooLow = await request(
            'PUT',
            `/api/v1/partner/laundries/${PARTNER_ID}`,
            input({
                capacityOverrides: [{ date: capacityDate, capacity: 2, note: 'Too few spaces' }],
            }),
            ownerAuthorization
        );
        expect(tooLow.status).toBe(409);
        expect(tooLow.body).toMatchObject({ error: { code: 'CAPACITY_BELOW_BOOKED' } });

        const restored = await request(
            'PUT',
            `/api/v1/partner/laundries/${PARTNER_ID}`,
            input(),
            ownerAuthorization
        );
        expect(restored.status).toBe(200);
        expect(restored.body).toMatchObject({ capacityOverrides: [] });
        const defaults = await pool.query<{ capacity: number; booked: number; state: string }>(
            `select capacity, booked, state from public.slots
             where id = any($1::text[]) order by id`,
            [[UNBOOKED_SLOT_ID, BOOKED_SLOT_ID]]
        );
        expect(defaults.rows).toEqual([
            { capacity: 8, booked: 4, state: 'open' },
            { capacity: 8, booked: 3, state: 'open' },
        ]);
    });

    it('removes unbooked slots, blocks booked slots and safely reopens a closure date', async () => {
        const dateResult = await pool.query<{ date: string }>(
            `select to_char(timezone('Asia/Kolkata', now())::date + 7, 'YYYY-MM-DD') as date`
        );
        const closureDate = dateResult.rows[0]!.date;
        await pool.query(
            `insert into public.slots
                (id, partner_id, starts_at, ends_at, capacity, booked, state)
             values
                ($1, $3,
                 timezone('Asia/Kolkata', ($4::date + time '08:00')::timestamp),
                 timezone('Asia/Kolkata', ($4::date + time '10:00')::timestamp),
                 8, 0, 'open'),
                ($2, $3,
                 timezone('Asia/Kolkata', ($4::date + time '10:00')::timestamp),
                 timezone('Asia/Kolkata', ($4::date + time '12:00')::timestamp),
                 8, 1, 'open')`,
            [UNBOOKED_SLOT_ID, BOOKED_SLOT_ID, PARTNER_ID, closureDate]
        );

        const closed = await request(
            'PUT',
            `/api/v1/partner/laundries/${PARTNER_ID}`,
            input({
                holidayClosures: [{ date: closureDate, reason: 'Maintenance' }],
            }),
            ownerAuthorization
        );
        expect(closed.status).toBe(200);
        expect(closed.body).toMatchObject({
            holidayClosures: [{ date: closureDate, reason: 'Maintenance' }],
        });

        const closedSlots = await pool.query<{ id: string; state: string; booked: number }>(
            `select id, state, booked from public.slots
             where id = any($1::text[]) order by id`,
            [[UNBOOKED_SLOT_ID, BOOKED_SLOT_ID]]
        );
        expect(closedSlots.rows).toEqual([{ id: BOOKED_SLOT_ID, state: 'blocked', booked: 1 }]);
        const remainingAvailability = await pool.query<{ count: string }>(
            `select count(*)::text as count
             from public.slots
             where partner_id = $1
               and timezone('Asia/Kolkata', starts_at)::date = $2::date
               and state = 'open'`,
            [PARTNER_ID, closureDate]
        );
        expect(remainingAvailability.rows[0]?.count).toBe('0');

        const reopened = await request(
            'PUT',
            `/api/v1/partner/laundries/${PARTNER_ID}`,
            input(),
            ownerAuthorization
        );
        expect(reopened.status).toBe(200);
        expect(reopened.body).toMatchObject({ holidayClosures: [] });
        const reopenedAvailability = await pool.query<{ count: string }>(
            `select count(*)::text as count
             from public.slots
             where partner_id = $1
               and timezone('Asia/Kolkata', starts_at)::date = $2::date
               and state = 'open'`,
            [PARTNER_ID, closureDate]
        );
        expect(Number(reopenedAvailability.rows[0]?.count)).toBeGreaterThan(0);
    });

    it('closes the public listing on a holiday even in manual availability mode', async () => {
        const dateResult = await pool.query<{ date: string }>(
            `select to_char(timezone('Asia/Kolkata', now())::date, 'YYYY-MM-DD') as date`
        );
        const today = dateResult.rows[0]!.date;
        const response = await request(
            'PUT',
            `/api/v1/partner/laundries/${PARTNER_ID}`,
            input({
                acceptingOrders: true,
                useOpeningHours: false,
                holidayClosures: [{ date: today, reason: '' }],
            }),
            ownerAuthorization
        );

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({ acceptingOrders: true, currentlyOpen: false });
        const publicDetail = await get(`/api/v1/partners/${PARTNER_ID}`);
        expect(publicDetail.status).toBe(200);
        expect(publicDetail.body).toMatchObject({ isOpen: false });
    });

    it('removes unbooked capacity and blocks booked capacity when hours change', async () => {
        await pool.query(
            `insert into public.slots
                (id, partner_id, starts_at, ends_at, capacity, booked, state)
             values
                ($1, $3, now() + interval '40 days', now() + interval '40 days 2 hours',
                 8, 0, 'open'),
                ($2, $3, now() + interval '40 days 4 hours', now() + interval '40 days 6 hours',
                 8, 1, 'open')`,
            [UNBOOKED_SLOT_ID, BOOKED_SLOT_ID, PARTNER_ID]
        );
        const closedHours = regularHours.map(({ weekday }) => ({
            weekday,
            opensAt: null,
            closesAt: null,
        }));

        const response = await request(
            'PUT',
            `/api/v1/partner/laundries/${PARTNER_ID}`,
            input({ openingHours: closedHours }),
            ownerAuthorization
        );
        expect(response.status).toBe(200);

        const slots = await pool.query<{ id: string; state: string; booked: number }>(
            `select id, state, booked from public.slots
             where id = any($1::text[]) order by id`,
            [[UNBOOKED_SLOT_ID, BOOKED_SLOT_ID]]
        );
        expect(slots.rows).toEqual([{ id: BOOKED_SLOT_ID, state: 'blocked', booked: 1 }]);
    });

    it('allows only approved owner columns and rejects another owner at the database boundary', async () => {
        const updated = await asCaller(pool, OWNER, (client) =>
            client.query('update public.partners set name = $2 where id = $1 returning name', [
                PARTNER_ID,
                'Allowed Owner Edit',
            ])
        );
        expect(updated.rows[0]).toEqual({ name: 'Allowed Owner Edit' });

        const hidden = await asCaller(pool, OTHER_OWNER, (client) =>
            client.query('update public.partners set name = $2 where id = $1 returning name', [
                PARTNER_ID,
                'Wrong Owner Edit',
            ])
        );
        expect(hidden.rowCount).toBe(0);

        await expect(
            asCaller(pool, OWNER, (client) =>
                client.query('update public.partners set rating = 5 where id = $1', [PARTNER_ID])
            )
        ).rejects.toThrow(/permission denied/i);

        await asCaller(pool, OWNER, (client) =>
            client.query('select public.replace_partner_service_areas($1, $2::text[])', [
                PARTNER_ID,
                ['560102', '560104'],
            ])
        );
        const coverage = await pool.query<{ pincode: string }>(
            `select pincode from public.partner_service_areas
             where partner_id = $1 order by pincode`,
            [PARTNER_ID]
        );
        expect(coverage.rows).toEqual([{ pincode: '560102' }, { pincode: '560104' }]);

        await expect(
            asCaller(pool, OTHER_OWNER, (client) =>
                client.query('select public.replace_partner_service_areas($1, $2::text[])', [
                    PARTNER_ID,
                    ['560103'],
                ])
            )
        ).rejects.toThrow(/PARTNER_NOT_FOUND/);

        await expect(
            asCaller(pool, OWNER, (client) =>
                client.query(
                    `insert into public.partner_service_areas (partner_id, pincode)
                     values ($1, '560105')`,
                    [PARTNER_ID]
                )
            )
        ).rejects.toThrow(/permission denied|row-level security/i);

        await asCaller(pool, OWNER, (client) =>
            client.query('select public.replace_partner_holiday_closures($1, $2::jsonb)', [
                PARTNER_ID,
                JSON.stringify([{ date: '2099-12-24', reason: 'Public holiday' }]),
            ])
        );
        const closures = await pool.query<{ closure_date: string; reason: string }>(
            `select to_char(closure_date, 'YYYY-MM-DD') as closure_date, reason
             from public.partner_holiday_closures where partner_id = $1`,
            [PARTNER_ID]
        );
        expect(closures.rows).toEqual([{ closure_date: '2099-12-24', reason: 'Public holiday' }]);

        await expect(
            asCaller(pool, OTHER_OWNER, (client) =>
                client.query('select public.replace_partner_holiday_closures($1, $2::jsonb)', [
                    PARTNER_ID,
                    '[]',
                ])
            )
        ).rejects.toThrow(/PARTNER_NOT_FOUND/);

        await expect(
            asCaller(pool, OWNER, (client) =>
                client.query(
                    `insert into public.partner_holiday_closures
                        (partner_id, closure_date, reason)
                     values ($1, '2099-12-25', 'Direct write')`,
                    [PARTNER_ID]
                )
            )
        ).rejects.toThrow(/permission denied|row-level security/i);

        await asCaller(pool, OWNER, (client) =>
            client.query('select public.replace_partner_capacity_overrides($1, $2::jsonb)', [
                PARTNER_ID,
                JSON.stringify([{ date: '2099-12-26', capacity: 12, note: 'Festival demand' }]),
            ])
        );
        const capacities = await pool.query<{
            capacity_date: string;
            capacity: number;
            note: string;
        }>(
            `select to_char(capacity_date, 'YYYY-MM-DD') as capacity_date, capacity, note
             from public.partner_capacity_overrides where partner_id = $1`,
            [PARTNER_ID]
        );
        expect(capacities.rows).toEqual([
            { capacity_date: '2099-12-26', capacity: 12, note: 'Festival demand' },
        ]);
        await pool.query(`select public.generate_slots($1, '2099-12-26'::date, 1)`, [PARTNER_ID]);
        const generatedCapacities = await pool.query<{ capacity: number }>(
            `select distinct capacity from public.slots
             where partner_id = $1
               and timezone('Asia/Kolkata', starts_at)::date = '2099-12-26'::date`,
            [PARTNER_ID]
        );
        expect(generatedCapacities.rows).toEqual([{ capacity: 12 }]);

        await expect(
            asCaller(pool, OTHER_OWNER, (client) =>
                client.query('select public.replace_partner_capacity_overrides($1, $2::jsonb)', [
                    PARTNER_ID,
                    '[]',
                ])
            )
        ).rejects.toThrow(/PARTNER_NOT_FOUND/);

        await expect(
            asCaller(pool, OWNER, (client) =>
                client.query(
                    `insert into public.partner_capacity_overrides
                        (partner_id, capacity_date, capacity, note)
                     values ($1, '2099-12-27', 10, 'Direct write')`,
                    [PARTNER_ID]
                )
            )
        ).rejects.toThrow(/permission denied|row-level security/i);
    });
});
