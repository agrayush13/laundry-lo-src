import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv } from '../app.js';
import { asCaller, type Client } from '../db/pool.js';
import { requireUser } from '../http/auth.js';
import { ApiError } from '../http/errors.js';
import { DEFAULT_LIMIT, MAX_LIMIT, decodeCursor, encodeCursor } from '../http/pagination.js';
import { parse } from '../http/validation.js';
import type { OrderEventType, OrderStatus, Page, PartnerOrderSummary } from '../models.js';
import {
    getPartnerOrder,
    listPartnerOrders,
    serializePartnerOrderSummary,
} from '../queries/orderQueries.js';

const orderStatus = z.enum(['processing', 'out_for_delivery', 'delivered', 'cancelled']);

const listQuery = z
    .object({
        partnerId: z.string().min(1).optional(),
        status: orderStatus.optional(),
        limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
        cursor: z.string().optional(),
    })
    .strict();

const lifecycleBody = z
    .object({
        type: z.enum(['confirmed', 'picked_up', 'in_progress', 'out_for_delivery', 'delivered']),
    })
    .strict();

interface LifecycleRow {
    order_id: string;
    status: OrderStatus;
    event_type: OrderEventType;
    occurred_at: Date;
}

const requirePartnerOwner = async (client: Client, partnerId?: string) => {
    const result = await client.query<{ owns_any: boolean; owns_requested: boolean }>(
        `select
             exists(select 1 from public.partners where owner_id = auth.uid()) as owns_any,
             ($1::text is null or public.owns_partner($1)) as owns_requested`,
        [partnerId ?? null]
    );
    const access = result.rows[0]!;
    if (!access.owns_any) {
        throw new ApiError('FORBIDDEN', 'A laundry-owner account is required.');
    }
    if (!access.owns_requested) {
        throw new ApiError('NOT_FOUND', 'That laundry was not found.');
    }
};

const translateLifecycleFailure = (error: unknown): never => {
    const message = error instanceof Error ? error.message : '';
    if (message === 'ORDER_NOT_FOUND') {
        throw new ApiError('NOT_FOUND', 'That order was not found.');
    }
    if (message === 'INVALID_ORDER_TRANSITION') {
        throw new ApiError(
            'INVALID_ORDER_TRANSITION',
            'That order cannot move to the requested stage.'
        );
    }
    throw error;
};

export const partnerOrderRoutes = new Hono<AppEnv>()
    .get('/', async (c) => {
        const userId = requireUser(c.get('userId'));
        const query = parse(listQuery, c.req.query());
        const scope = `partner-orders:${query.partnerId ?? '*'}:${query.status ?? '*'}:placed-at-desc`;
        const cursor = decodeCursor(query.cursor, scope);
        const page = await asCaller(c.get('pool'), userId, async (client) => {
            await requirePartnerOwner(client, query.partnerId);
            const rows = await listPartnerOrders(client, {
                ...(query.partnerId ? { partnerId: query.partnerId } : {}),
                ...(query.status ? { status: query.status } : {}),
                ...(cursor ? { cursorKey: cursor.key, cursorId: cursor.id } : {}),
                limit: query.limit + 1,
            });
            const hasMore = rows.length > query.limit;
            const visible = hasMore ? rows.slice(0, query.limit) : rows;
            const last = visible[visible.length - 1];
            const body: Page<PartnerOrderSummary> = {
                data: visible.map(serializePartnerOrderSummary),
                nextCursor:
                    hasMore && last
                        ? encodeCursor({ key: last.placed_at.getTime(), id: last.id, scope })
                        : null,
            };
            return body;
        });
        return c.json(page);
    })
    .get('/:id', async (c) => {
        const userId = requireUser(c.get('userId'));
        const order = await asCaller(c.get('pool'), userId, (client) =>
            getPartnerOrder(client, c.req.param('id'))
        );
        if (!order) throw new ApiError('NOT_FOUND', 'That order was not found.');
        return c.json(order);
    })
    .post('/:id/events', async (c) => {
        const userId = requireUser(c.get('userId'));
        const input = parse(lifecycleBody, await c.req.json().catch(() => ({})));
        const row = await asCaller(c.get('pool'), userId, async (client) => {
            const result = await client.query<LifecycleRow>(
                'select * from public.advance_order($1, $2)',
                [c.req.param('id'), input.type]
            );
            return result.rows[0]!;
        }).catch(translateLifecycleFailure);

        return c.json(
            {
                orderId: row.order_id,
                status: row.status,
                event: {
                    type: row.event_type,
                    occurredAt: row.occurred_at.toISOString(),
                },
            },
            201
        );
    });
