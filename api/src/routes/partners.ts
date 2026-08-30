import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv } from '../app.js';
import { asCaller } from '../db/pool.js';
import { partnerNotFound } from '../http/errors.js';
import { DEFAULT_LIMIT, MAX_LIMIT, decodeCursor, encodeCursor } from '../http/pagination.js';
import { toCatalog, toPartner, toPartnerDetail, toSlotDays } from '../http/serializers.js';
import { csv, parse } from '../http/validation.js';
import type { CatalogCategory, Page, Partner as ApiPartner, SlotDay } from '../models.js';
import {
    getCatalog,
    getOpeningHours,
    getPartner,
    getSlots,
    listPartners,
    partnerExists,
    type PartnerSort,
} from '../queries/partnerQueries.js';

const pincode = z.string().regex(/^[0-9]{6}$/, 'Pincode must be 6 digits.');
const serviceId = z.enum(['wash-fold', 'wash-iron', 'dry-cleaning', 'premium-care']);

const listQuery = z
    .object({
        pincode: pincode.optional(),
        latitude: z.coerce.number().min(-90).max(90).optional(),
        longitude: z.coerce.number().min(-180).max(180).optional(),
        services: z.array(serviceId).optional(),
        tags: z.array(z.string()).optional(),
        sort: z.enum(['rating', 'distance', 'turnaround', 'price']).default('rating'),
        limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
        cursor: z.string().optional(),
    })
    .superRefine(({ pincode: pin, latitude, longitude, sort }, context) => {
        const hasLatitude = latitude !== undefined;
        const hasLongitude = longitude !== undefined;

        if (hasLatitude !== hasLongitude) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                path: [hasLatitude ? 'longitude' : 'latitude'],
                message: 'Latitude and longitude must be supplied together.',
            });
        }

        if (sort === 'distance' && !pin && !(hasLatitude && hasLongitude)) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['sort'],
                message: 'Distance sorting requires a pincode or coordinates.',
            });
        }
    });

const calendarDate = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a YYYY-MM-DD date.')
    .refine((value) => {
        const [year, month, day] = value.split('-').map(Number);
        const parsed = new Date(Date.UTC(year!, month! - 1, day!));
        return (
            parsed.getUTCFullYear() === year &&
            parsed.getUTCMonth() === month! - 1 &&
            parsed.getUTCDate() === day
        );
    }, 'Use a real calendar date.');

const slotsQuery = z.object({
    from: calendarDate.optional(),
    days: z.coerce.number().int().min(1).max(14).default(7),
});

const listingScope = (query: z.output<typeof listQuery>): string =>
    JSON.stringify({
        pincode: query.pincode ?? null,
        latitude: query.latitude ?? null,
        longitude: query.longitude ?? null,
        services: [...(query.services ?? [])].sort(),
        tags: [...(query.tags ?? [])].sort(),
        sort: query.sort,
    });

/** Today in IST, which is the day a customer in Bengaluru means by "today". */
const todayInIst = (): string =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

export const partnerRoutes = new Hono<AppEnv>()
    .get('/', async (c) => {
        const raw = c.req.query();
        const query = parse(listQuery, {
            ...raw,
            services: csv(c.req.queries('services') ?? raw['services']),
            tags: csv(c.req.queries('tags') ?? raw['tags']),
        });
        const scope = listingScope(query);
        const cursor = decodeCursor(query.cursor, scope);

        const rows = await asCaller(c.get('pool'), c.get('userId'), (client) =>
            listPartners(client, {
                pincode: query.pincode,
                latitude: query.latitude,
                longitude: query.longitude,
                services: query.services,
                tags: query.tags,
                sort: query.sort as PartnerSort,
                limit: query.limit,
                cursor,
            })
        );

        // The extra row was only ever a lookahead; it belongs to the next page.
        const hasMore = rows.length > query.limit;
        const page = hasMore ? rows.slice(0, query.limit) : rows;
        const last = page[page.length - 1];

        const body: Page<ApiPartner> = {
            data: page.map(toPartner),
            nextCursor:
                hasMore && last ? encodeCursor({ key: last.sort_key, id: last.id, scope }) : null,
        };
        return c.json(body);
    })
    .get('/:id', async (c) => {
        const id = c.req.param('id');
        const detail = await asCaller(c.get('pool'), c.get('userId'), async (client) => {
            const row = await getPartner(client, id);
            if (!row) return null;
            return toPartnerDetail(row, await getOpeningHours(client, id));
        });

        if (!detail) throw partnerNotFound();
        return c.json(detail);
    })
    .get('/:id/catalog', async (c) => {
        const id = c.req.param('id');
        const categories = await asCaller(c.get('pool'), c.get('userId'), async (client) =>
            (await partnerExists(client, id)) ? toCatalog(await getCatalog(client, id)) : null
        );

        if (!categories) throw partnerNotFound();
        const body: { categories: CatalogCategory[] } = { categories };
        return c.json(body);
    })
    .get('/:id/slots', async (c) => {
        const id = c.req.param('id');
        const query = parse(slotsQuery, c.req.query());
        const from = query.from ?? todayInIst();

        const days = await asCaller(c.get('pool'), c.get('userId'), async (client) =>
            (await partnerExists(client, id))
                ? toSlotDays(await getSlots(client, id, from, query.days))
                : null
        );

        if (!days) throw partnerNotFound();
        const body: { days: SlotDay[] } = { days };
        return c.json(body);
    });
