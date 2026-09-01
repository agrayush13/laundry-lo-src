import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv } from '../app.js';
import { asCaller, type Client } from '../db/pool.js';
import { requireUser } from '../http/auth.js';
import { ApiError } from '../http/errors.js';
import { parse } from '../http/validation.js';
import type { Profile, SavedAddress } from '../models.js';
import { getMembership, PLUS_PRICE } from '../queries/customerQueries.js';
import { money } from '../http/money.js';

const text = (label: string, max: number) =>
    z.string().trim().min(1, `${label} is required.`).max(max, `${label} is too long.`);
const phone = z
    .string()
    .trim()
    .min(7, 'Enter a valid phone number.')
    .max(24, 'Enter a valid phone number.');
const pincode = z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits.');

const profilePatch = z
    .object({
        fullName: text('Name', 120).optional(),
        phone: phone.optional(),
        preferences: z
            .object({ sms: z.boolean().optional(), email: z.boolean().optional() })
            .optional(),
    })
    .refine((value) => Object.keys(value).length > 0, 'Provide at least one change.');

const addressFields = {
    label: text('Label', 40),
    recipientName: text('Recipient name', 120),
    phone,
    building: text('Building', 160),
    street: text('Street', 240),
    landmark: z.string().trim().max(160, 'Landmark is too long.').default(''),
    pincode,
    isDefault: z.boolean().optional(),
};
const createAddress = z.object(addressFields);
const patchAddress = z
    .object({
        label: addressFields.label.optional(),
        recipientName: addressFields.recipientName.optional(),
        phone: addressFields.phone.optional(),
        building: addressFields.building.optional(),
        street: addressFields.street.optional(),
        landmark: addressFields.landmark.optional(),
        pincode: addressFields.pincode.optional(),
        isDefault: z.literal(true).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, 'Provide at least one change.');

interface ProfileRow {
    id: string;
    full_name: string | null;
    phone: string | null;
    sms_opt_in: boolean;
    email_opt_in: boolean;
    created_at: Date;
}

interface AddressRow {
    id: string;
    label: string;
    recipient_name: string;
    phone: string;
    building: string;
    street: string;
    landmark: string | null;
    pincode: string;
    is_default: boolean;
}

const toProfile = (row: ProfileRow, email: string): Profile => ({
    id: row.id,
    fullName: row.full_name || email.split('@')[0] || 'Customer',
    email,
    phone: row.phone ?? '',
    memberSince: row.created_at.toISOString(),
    preferences: { sms: row.sms_opt_in, email: row.email_opt_in },
});

const toAddress = (row: AddressRow): SavedAddress => ({
    id: row.id,
    label: row.label,
    recipientName: row.recipient_name,
    phone: row.phone,
    building: row.building,
    street: row.street,
    landmark: row.landmark ?? '',
    pincode: row.pincode,
    isDefault: row.is_default,
});

const readProfile = async (client: Client, userId: string) => {
    const { rows } = await client.query<ProfileRow>(
        `select id, full_name, phone, sms_opt_in, email_opt_in, created_at
         from public.profiles where id = $1`,
        [userId]
    );
    return rows[0] ?? null;
};

// The partial unique index guarantees at most one default address. Locking the
// user's profile also makes concurrent address-book changes deterministic
// instead of surfacing that constraint as an internal error.
const lockAddressBook = (client: Client, userId: string) =>
    client.query('select id from public.profiles where id = $1 for update', [userId]);

export const accountRoutes = new Hono<AppEnv>()
    .get('/', async (c) => {
        const userId = requireUser(c.get('userId'));
        const row = await asCaller(c.get('pool'), userId, (client) => readProfile(client, userId));
        if (!row) throw new ApiError('PROFILE_NOT_FOUND', 'Your profile could not be found.');
        return c.json(toProfile(row, c.get('userEmail')));
    })
    .patch('/', async (c) => {
        const userId = requireUser(c.get('userId'));
        const input = parse(profilePatch, await c.req.json().catch(() => ({})));
        const row = await asCaller(c.get('pool'), userId, async (client) => {
            await client.query(
                `update public.profiles
                 set full_name = coalesce($2, full_name),
                     phone = coalesce($3, phone),
                     sms_opt_in = coalesce($4, sms_opt_in),
                     email_opt_in = coalesce($5, email_opt_in)
                 where id = $1`,
                [
                    userId,
                    input.fullName ?? null,
                    input.phone ?? null,
                    input.preferences?.sms ?? null,
                    input.preferences?.email ?? null,
                ]
            );
            return readProfile(client, userId);
        });
        if (!row) throw new ApiError('PROFILE_NOT_FOUND', 'Your profile could not be found.');
        return c.json(toProfile(row, c.get('userEmail')));
    })
    .get('/membership', async (c) => {
        const userId = requireUser(c.get('userId'));
        const membership = await asCaller(c.get('pool'), userId, (client) =>
            getMembership(client, userId)
        );
        return c.json(membership);
    });

export const addressRoutes = new Hono<AppEnv>()
    .get('/', async (c) => {
        const userId = requireUser(c.get('userId'));
        const rows = await asCaller(c.get('pool'), userId, async (client) => {
            const result = await client.query<AddressRow>(
                `select id, label, recipient_name, phone, building, street,
                        landmark, pincode, is_default
                 from public.addresses where user_id = $1
                 order by is_default desc, created_at, id`,
                [userId]
            );
            return result.rows;
        });
        return c.json({ data: rows.map(toAddress) });
    })
    .post('/', async (c) => {
        const userId = requireUser(c.get('userId'));
        const input = parse(createAddress, await c.req.json().catch(() => ({})));
        const row = await asCaller(c.get('pool'), userId, async (client) => {
            await lockAddressBook(client, userId);
            const count = await client.query<{ count: string }>(
                'select count(*) as count from public.addresses where user_id = $1',
                [userId]
            );
            const isDefault = input.isDefault === true || count.rows[0]?.count === '0';
            if (isDefault) {
                await client.query(
                    'update public.addresses set is_default = false where user_id = $1',
                    [userId]
                );
            }
            const result = await client.query<AddressRow>(
                `insert into public.addresses (
                    user_id, label, recipient_name, phone, building, street,
                    landmark, pincode, is_default
                 ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
                 returning id, label, recipient_name, phone, building, street,
                           landmark, pincode, is_default`,
                [
                    userId,
                    input.label,
                    input.recipientName,
                    input.phone,
                    input.building,
                    input.street,
                    input.landmark,
                    input.pincode,
                    isDefault,
                ]
            );
            return result.rows[0]!;
        });
        return c.json(toAddress(row), 201);
    })
    .patch('/:id', async (c) => {
        const userId = requireUser(c.get('userId'));
        const input = parse(patchAddress, await c.req.json().catch(() => ({})));
        const row = await asCaller(c.get('pool'), userId, async (client) => {
            await lockAddressBook(client, userId);
            const target = await client.query(
                'select 1 from public.addresses where id = $2 and user_id = $1',
                [userId, c.req.param('id')]
            );
            if (target.rowCount === 0) return null;
            if (input.isDefault) {
                await client.query(
                    'update public.addresses set is_default = false where user_id = $1',
                    [userId]
                );
            }
            const result = await client.query<AddressRow>(
                `update public.addresses
                 set label = coalesce($3, label),
                     recipient_name = coalesce($4, recipient_name),
                     phone = coalesce($5, phone),
                     building = coalesce($6, building),
                     street = coalesce($7, street),
                     landmark = coalesce($8, landmark),
                     pincode = coalesce($9, pincode),
                     is_default = coalesce($10, is_default)
                 where id = $2 and user_id = $1
                 returning id, label, recipient_name, phone, building, street,
                           landmark, pincode, is_default`,
                [
                    userId,
                    c.req.param('id'),
                    input.label ?? null,
                    input.recipientName ?? null,
                    input.phone ?? null,
                    input.building ?? null,
                    input.street ?? null,
                    input.landmark ?? null,
                    input.pincode ?? null,
                    input.isDefault ?? null,
                ]
            );
            return result.rows[0] ?? null;
        });
        if (!row) throw new ApiError('ADDRESS_NOT_FOUND', 'That saved address was not found.');
        return c.json(toAddress(row));
    })
    .delete('/:id', async (c) => {
        const userId = requireUser(c.get('userId'));
        const deleted = await asCaller(c.get('pool'), userId, async (client) => {
            await lockAddressBook(client, userId);
            const result = await client.query<{ is_default: boolean }>(
                `delete from public.addresses where id = $2 and user_id = $1
                 returning is_default`,
                [userId, c.req.param('id')]
            );
            const row = result.rows[0];
            if (row?.is_default) {
                await client.query(
                    `update public.addresses set is_default = true
                     where id = (
                         select id from public.addresses where user_id = $1
                         order by created_at, id limit 1
                     )`,
                    [userId]
                );
            }
            return Boolean(row);
        });
        if (!deleted) throw new ApiError('ADDRESS_NOT_FOUND', 'That saved address was not found.');
        return c.body(null, 204);
    });

export const membershipRoutes = new Hono<AppEnv>().get('/plans', (c) =>
    c.json({
        data: [
            {
                id: 'plus' as const,
                name: 'laundrylo Plus',
                price: money(PLUS_PRICE),
                period: 'month' as const,
                benefits: ['free-pickup', 'ten-percent-off', 'priority-slots'],
            },
        ],
    })
);
