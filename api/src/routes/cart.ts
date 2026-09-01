import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv } from '../app.js';
import { asCaller, type Client } from '../db/pool.js';
import { requireUser } from '../http/auth.js';
import { ApiError } from '../http/errors.js';
import { parse } from '../http/validation.js';
import { getCart } from '../queries/customerQueries.js';

const quantityBody = z.object({
    quantity: z.number().int().min(0, 'Quantity cannot be negative.').max(99),
});

const lockCartOwner = (client: Client, userId: string) =>
    client.query('select id from public.profiles where id = $1 for update', [userId]);

export const cartRoutes = new Hono<AppEnv>()
    .get('/', async (c) => {
        const userId = requireUser(c.get('userId'));
        return c.json(await asCaller(c.get('pool'), userId, (client) => getCart(client, userId)));
    })
    .put('/items/:itemId', async (c) => {
        const userId = requireUser(c.get('userId'));
        const input = parse(quantityBody, await c.req.json().catch(() => ({})));
        const itemId = c.req.param('itemId');

        const cart = await asCaller(c.get('pool'), userId, async (client) => {
            await lockCartOwner(client, userId);
            const existing = await client.query<{
                id: string;
                partner_id: string | null;
                item_count: number;
            }>(
                `select c.id, c.partner_id,
                        (select count(*)::integer from public.cart_items ci where ci.cart_id = c.id) as item_count
                 from public.carts c where c.user_id = $1 for update`,
                [userId]
            );

            if (input.quantity === 0) {
                const current = existing.rows[0];
                if (current) {
                    await client.query(
                        'delete from public.cart_items where cart_id = $1 and item_id = $2',
                        [current.id, itemId]
                    );
                    await client.query(
                        `update public.carts set partner_id = null
                         where id = $1 and not exists (
                             select 1 from public.cart_items where cart_id = $1
                         )`,
                        [current.id]
                    );
                }
                return getCart(client, userId);
            }

            const item = await client.query<{ partner_id: string }>(
                `select cc.partner_id
                 from public.catalog_items i
                 join public.catalog_categories cc on cc.id = i.category_id
                 where i.id = $1 and i.is_active`,
                [itemId]
            );
            const partnerId = item.rows[0]?.partner_id;
            if (!partnerId) throw new ApiError('NOT_FOUND', 'That catalogue item was not found.');

            let current = existing.rows[0];
            if (!current) {
                const created = await client.query<{
                    id: string;
                    partner_id: string;
                    item_count: number;
                }>(
                    `insert into public.carts (user_id, partner_id) values ($1, $2)
                     returning id, partner_id, 0::integer as item_count`,
                    [userId, partnerId]
                );
                current = created.rows[0]!;
            } else if (current.partner_id && current.partner_id !== partnerId) {
                throw new ApiError(
                    'CART_PARTNER_CONFLICT',
                    'Your cart contains items from another laundry.'
                );
            } else if (!current.partner_id) {
                await client.query('update public.carts set partner_id = $2 where id = $1', [
                    current.id,
                    partnerId,
                ]);
            }

            await client.query(
                `insert into public.cart_items (cart_id, item_id, quantity)
                 values ($1, $2, $3)
                 on conflict (cart_id, item_id) do update set quantity = excluded.quantity`,
                [current.id, itemId, input.quantity]
            );
            return getCart(client, userId);
        });

        return c.json(cart);
    })
    .post('/membership', async (c) => {
        const userId = requireUser(c.get('userId'));
        const cart = await asCaller(c.get('pool'), userId, async (client) => {
            await lockCartOwner(client, userId);
            await client.query(
                `insert into public.carts (user_id, has_plus) values ($1, true)
                 on conflict (user_id) do update set has_plus = true`,
                [userId]
            );
            return getCart(client, userId);
        });
        return c.json(cart);
    })
    .delete('/membership', async (c) => {
        const userId = requireUser(c.get('userId'));
        const cart = await asCaller(c.get('pool'), userId, async (client) => {
            await lockCartOwner(client, userId);
            await client.query('update public.carts set has_plus = false where user_id = $1', [
                userId,
            ]);
            return getCart(client, userId);
        });
        return c.json(cart);
    })
    .delete('/', async (c) => {
        const userId = requireUser(c.get('userId'));
        await asCaller(c.get('pool'), userId, async (client) => {
            await lockCartOwner(client, userId);
            await client.query('delete from public.carts where user_id = $1', [userId]);
        });
        return c.body(null, 204);
    });
