import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv } from '../app.js';
import { asCaller } from '../db/pool.js';
import { requireUser } from '../http/auth.js';
import { ApiError } from '../http/errors.js';
import { parse } from '../http/validation.js';
import {
    getOwnedPartnerConfiguration,
    listOwnedPartnerConfigurations,
    updateOwnedPartnerConfiguration,
} from '../queries/partnerConfigurationQueries.js';
import {
    getOwnedPartnerCatalog,
    updateOwnedCatalogCategory,
    updateOwnedCatalogItem,
} from '../queries/partnerCatalogQueries.js';

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use a 24-hour time such as 08:30.');
const pincode = z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter a 6-digit pincode.');
const todayInIst = () => {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date());
    const part = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((candidate) => candidate.type === type)?.value ?? '';
    return `${part('year')}-${part('month')}-${part('day')}`;
};
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
    }, 'Use a real calendar date.')
    .refine((value) => value >= todayInIst(), 'Closure dates cannot be in the past.');
const holidayClosure = z
    .object({
        date: calendarDate,
        reason: z.string().trim().max(120),
    })
    .strict();

const openingHour = z
    .object({
        weekday: z.number().int().min(0).max(6),
        opensAt: time.nullable(),
        closesAt: time.nullable(),
    })
    .strict()
    .superRefine((value, context) => {
        if ((value.opensAt === null) !== (value.closesAt === null)) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Set both times, or mark the day as closed.',
                path: ['opensAt'],
            });
        } else if (value.opensAt !== null && value.opensAt >= value.closesAt!) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Closing time must be after opening time.',
                path: ['closesAt'],
            });
        }
    });

const configurationBody = z
    .object({
        name: z.string().trim().min(1).max(120),
        about: z.string().trim().max(1000),
        address: z
            .object({
                line1: z.string().trim().min(1).max(160),
                line2: z.string().trim().max(160),
                city: z.string().trim().min(1).max(80),
                pincode,
            })
            .strict(),
        servicePincodes: z.array(pincode).min(1).max(50),
        holidayClosures: z.array(holidayClosure).max(60),
        turnaroundHours: z.number().int().min(1).max(336),
        acceptingOrders: z.boolean(),
        useOpeningHours: z.boolean(),
        openingHours: z.array(openingHour).length(7),
    })
    .strict()
    .superRefine((value, context) => {
        const weekdays = new Set(value.openingHours.map((hour) => hour.weekday));
        if (weekdays.size !== 7) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Include each weekday exactly once.',
                path: ['openingHours'],
            });
        }

        if (new Set(value.servicePincodes).size !== value.servicePincodes.length) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Each service pincode must be unique.',
                path: ['servicePincodes'],
            });
        }

        const closureDates = value.holidayClosures.map(({ date }) => date);
        if (new Set(closureDates).size !== closureDates.length) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Each holiday closure date must be unique.',
                path: ['holidayClosures'],
            });
        }
    });

const categoryBody = z
    .object({
        name: z.string().trim().min(1).max(80),
    })
    .strict();

const itemBody = z
    .object({
        name: z.string().trim().min(1).max(120),
        description: z
            .string()
            .trim()
            .max(500)
            .nullable()
            .transform((value) => value || null),
        price: z
            .object({
                amount: z.number().int().min(0).max(100000000),
                currency: z.literal('INR'),
            })
            .strict(),
        isActive: z.boolean(),
    })
    .strict();

const notFound = () => new ApiError('NOT_FOUND', 'That laundry was not found.');

export const partnerLaundryRoutes = new Hono<AppEnv>()
    .get('/', async (c) => {
        const userId = requireUser(c.get('userId'));
        const data = await asCaller(c.get('pool'), userId, listOwnedPartnerConfigurations);
        if (data.length === 0) {
            throw new ApiError('FORBIDDEN', 'A laundry-owner account is required.');
        }
        return c.json({ data });
    })
    .get('/:id', async (c) => {
        const userId = requireUser(c.get('userId'));
        const configuration = await asCaller(c.get('pool'), userId, (client) =>
            getOwnedPartnerConfiguration(client, c.req.param('id'))
        );
        if (!configuration) throw notFound();
        return c.json(configuration);
    })
    .put('/:id', async (c) => {
        const userId = requireUser(c.get('userId'));
        const input = parse(configurationBody, await c.req.json().catch(() => ({})));
        const configuration = await asCaller(c.get('pool'), userId, (client) =>
            updateOwnedPartnerConfiguration(client, c.req.param('id'), input)
        );
        if (!configuration) throw notFound();
        return c.json(configuration);
    })
    .get('/:id/catalog', async (c) => {
        const userId = requireUser(c.get('userId'));
        const categories = await asCaller(c.get('pool'), userId, (client) =>
            getOwnedPartnerCatalog(client, c.req.param('id'))
        );
        if (!categories) throw notFound();
        return c.json({ categories });
    })
    .patch('/:id/catalog/categories/:categoryId', async (c) => {
        const userId = requireUser(c.get('userId'));
        const input = parse(categoryBody, await c.req.json().catch(() => ({})));
        const category = await asCaller(c.get('pool'), userId, (client) =>
            updateOwnedCatalogCategory(
                client,
                c.req.param('id'),
                c.req.param('categoryId'),
                input.name
            )
        );
        if (!category) throw notFound();
        return c.json(category);
    })
    .patch('/:id/catalog/items/:itemId', async (c) => {
        const userId = requireUser(c.get('userId'));
        const input = parse(itemBody, await c.req.json().catch(() => ({})));
        const item = await asCaller(c.get('pool'), userId, (client) =>
            updateOwnedCatalogItem(client, c.req.param('id'), c.req.param('itemId'), input)
        );
        if (!item) throw notFound();
        return c.json(item);
    });
