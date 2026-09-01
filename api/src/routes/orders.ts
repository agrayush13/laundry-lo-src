import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv } from '../app.js';
import { asCaller } from '../db/pool.js';
import { requireUser } from '../http/auth.js';
import { ApiError } from '../http/errors.js';
import { DEFAULT_LIMIT, MAX_LIMIT, decodeCursor, encodeCursor } from '../http/pagination.js';
import { parse } from '../http/validation.js';
import type { Order, Page } from '../models.js';
import { getOrder } from '../queries/customerQueries.js';

const createOrderBody = z.object({
    cartId: z.string().min(1, 'Cart is required.'),
    addressId: z.string().min(1, 'Address is required.'),
    pickupSlotId: z.string().min(1, 'Pickup slot is required.'),
    deliverySlotId: z.string().min(1, 'Delivery slot is required.'),
    paymentMethod: z.literal('cash_on_pickup'),
});

const listQuery = z.object({
    limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
    cursor: z.string().optional(),
});

const IDEMPOTENCY_KEY = z.string().uuid('Idempotency-Key must be a UUID.');
const ORDER_CURSOR_SCOPE = 'orders:placed-at-desc';

interface PlacementRow {
    order_id: string;
    replayed: boolean;
}

const databaseFailures = new Map<string, ConstructorParameters<typeof ApiError>>([
    ['CART_NOT_FOUND', ['CART_NOT_FOUND', 'That cart no longer exists.']],
    ['CART_EMPTY', ['CART_EMPTY', 'Add at least one laundry item before placing the order.']],
    ['CART_CHANGED', ['CART_CHANGED', 'Your cart changed because an item is no longer available.']],
    ['ADDRESS_NOT_FOUND', ['ADDRESS_NOT_FOUND', 'That saved address was not found.']],
    ['SLOT_UNAVAILABLE', ['SLOT_UNAVAILABLE', 'One of those time slots is no longer available.']],
    ['PARTNER_CLOSED', ['PARTNER_CLOSED', 'That laundry is not accepting orders right now.']],
    ['UNAUTHENTICATED', ['UNAUTHENTICATED', 'Please sign in to continue.']],
]);

const translatePlacementFailure = (error: unknown): never => {
    const message = error instanceof Error ? error.message : '';
    const failure = databaseFailures.get(message);
    if (failure) throw new ApiError(...failure);
    throw error;
};

// A small application-level guard against accidental or abusive repeat order
// submission. Production should retain an edge/shared limiter too, because
// each service instance has its own memory.
const placementWindows = new Map<string, { startedAt: number; count: number }>();
const enforcePlacementRate = (userId: string) => {
    const now = Date.now();
    if (placementWindows.size > 1_000) {
        for (const [id, window] of placementWindows) {
            if (now - window.startedAt >= 60_000) placementWindows.delete(id);
        }
    }
    const current = placementWindows.get(userId);
    if (!current || now - current.startedAt >= 60_000) {
        placementWindows.set(userId, { startedAt: now, count: 1 });
        return;
    }
    current.count += 1;
    if (current.count > 20) {
        throw new ApiError('RATE_LIMITED', 'Too many order attempts. Please wait a minute.');
    }
};

export const orderRoutes = new Hono<AppEnv>()
    .post('/', async (c) => {
        const userId = requireUser(c.get('userId'));
        enforcePlacementRate(userId);
        const idempotencyKey = c.req.header('Idempotency-Key');
        if (!idempotencyKey) {
            throw new ApiError(
                'IDEMPOTENCY_KEY_REQUIRED',
                'An Idempotency-Key is required to place an order safely.'
            );
        }
        const parsedKey = parse(IDEMPOTENCY_KEY, idempotencyKey);
        const input = parse(createOrderBody, await c.req.json().catch(() => ({})));

        const result = await asCaller(c.get('pool'), userId, async (client) => {
            const placement = await client.query<PlacementRow>(
                `select * from public.place_order($1,$2,$3,$4,$5,$6)`,
                [
                    input.cartId,
                    input.addressId,
                    input.pickupSlotId,
                    input.deliverySlotId,
                    input.paymentMethod,
                    parsedKey,
                ]
            );
            const row = placement.rows[0]!;
            const order = await getOrder(client, userId, row.order_id);
            if (!order) throw new Error('Placed order could not be read back.');
            return { order, replayed: row.replayed };
        }).catch(translatePlacementFailure);

        return result.replayed ? c.json(result.order) : c.json(result.order, 201);
    })
    .get('/', async (c) => {
        const userId = requireUser(c.get('userId'));
        const query = parse(listQuery, c.req.query());
        const cursor = decodeCursor(query.cursor, ORDER_CURSOR_SCOPE);
        const page = await asCaller(c.get('pool'), userId, async (client) => {
            const result = await client.query<{ id: string; placed_at: Date }>(
                `select id, placed_at from public.orders
                 where user_id = $1
                   and ($2::double precision is null or (placed_at, id) < (to_timestamp($2 / 1000.0), $3))
                 order by placed_at desc, id desc
                 limit $4`,
                [userId, cursor?.key ?? null, cursor?.id ?? null, query.limit + 1]
            );
            const hasMore = result.rows.length > query.limit;
            const rows = hasMore ? result.rows.slice(0, query.limit) : result.rows;
            const orders: Order[] = [];
            for (const row of rows) {
                const order = await getOrder(client, userId, row.id);
                if (order) orders.push(order);
            }
            const last = rows[rows.length - 1];
            const body: Page<Order> = {
                data: orders,
                nextCursor:
                    hasMore && last
                        ? encodeCursor({
                              key: last.placed_at.getTime(),
                              id: last.id,
                              scope: ORDER_CURSOR_SCOPE,
                          })
                        : null,
            };
            return body;
        });
        return c.json(page);
    })
    .get('/:id', async (c) => {
        const userId = requireUser(c.get('userId'));
        const order = await asCaller(c.get('pool'), userId, (client) =>
            getOrder(client, userId, c.req.param('id'))
        );
        if (!order) throw new ApiError('NOT_FOUND', 'That order was not found.');
        return c.json(order);
    });
