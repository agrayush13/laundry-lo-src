import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { get, pool, requireDatabase } from './helpers.js';
import type { Page, Partner, PartnerDetail } from '../src/models.js';

interface PartnerFixture {
    id: string;
    name: string;
    rating: number;
    reviewCount: number;
    line1: string;
    line2: string;
    pincode: string;
    tags: string[];
    services: string[];
    turnaroundHours: number;
    isOpen: boolean;
    startingPriceAmount: number;
}

const partnerFixtures = JSON.parse(
    readFileSync(new URL('../../fixtures/partners.json', import.meta.url), 'utf8')
) as PartnerFixture[];

beforeAll(requireDatabase);
afterAll(async () => {
    await pool.end();
});

describe('GET /api/v1/partners', () => {
    it('returns the seeded partners in the contract shape', async () => {
        const { status, body } = await get('/api/v1/partners');
        const page = body as Page<Partner>;

        expect(status).toBe(200);
        expect(page.data.length).toBeGreaterThan(0);

        const partner = page.data[0]!;
        expect(partner).toMatchObject({
            id: expect.any(String),
            name: expect.any(String),
            reviewCount: expect.any(Number),
            turnaroundHours: expect.any(Number),
            isOpen: expect.any(Boolean),
        });
        expect(partner.address).toMatchObject({ city: 'Bengaluru' });
        // Money is integer minor units plus a currency, never a float.
        expect(Number.isInteger(partner.startingPrice?.amount)).toBe(true);
        expect(partner.startingPrice?.currency).toBe('INR');
        expect(partner.startingPrice?.unit).toBe('piece');
    });

    it('keeps the UI fixture aligned with the database seed', async () => {
        const { body } = await get('/api/v1/partners?limit=20');
        const actual = new Map(
            (body as Page<Partner>).data.map((partner) => [partner.id, partner])
        );

        expect([...actual.keys()].sort()).toEqual(partnerFixtures.map(({ id }) => id).sort());
        for (const expected of partnerFixtures) {
            const partner = actual.get(expected.id);
            expect(partner).toMatchObject({
                id: expected.id,
                name: expected.name,
                rating: expected.rating,
                reviewCount: expected.reviewCount,
                address: {
                    line1: expected.line1,
                    line2: expected.line2,
                    city: 'Bengaluru',
                    pincode: expected.pincode,
                },
                tags: [...expected.tags].sort(),
                services: expect.arrayContaining(expected.services),
                turnaroundHours: expected.turnaroundHours,
                isOpen: expected.isOpen,
                startingPrice: {
                    amount: expected.startingPriceAmount,
                    currency: 'INR',
                    unit: 'piece',
                },
            });
            expect([...(partner?.services ?? [])].sort()).toEqual([...expected.services].sort());
        }
    });

    it('sorts by rating by default', async () => {
        const { body } = await get('/api/v1/partners');
        const ratings = (body as Page<Partner>).data.map((p) => p.rating ?? 0);
        expect(ratings).toEqual([...ratings].sort((a, b) => b - a));
    });

    it('filters by pincode', async () => {
        const { body } = await get('/api/v1/partners?pincode=560103');
        const page = body as Page<Partner>;
        expect(page.data.length).toBeGreaterThan(0);
        expect(page.data.every((p) => p.address.pincode === '560103')).toBe(true);
    });

    it('measures distance from the searched pincode', async () => {
        const { body } = await get('/api/v1/partners?pincode=560103&sort=distance');
        const distances = (body as Page<Partner>).data.map((p) => p.distanceMeters ?? 0);

        expect(distances.every(Number.isInteger)).toBe(true);
        expect(distances).toEqual([...distances].sort((a, b) => a - b));
    });

    it('omits distance when there is nothing to measure from', async () => {
        const { body } = await get('/api/v1/partners');
        expect((body as Page<Partner>).data.every((p) => p.distanceMeters === null)).toBe(true);
    });

    it('matches partners offering every requested service, not any of them', async () => {
        const { body } = await get('/api/v1/partners?services=wash-fold,dry-cleaning');
        const page = body as Page<Partner>;

        expect(page.data.length).toBeGreaterThan(0);
        for (const partner of page.data) {
            expect(partner.services).toEqual(expect.arrayContaining(['wash-fold', 'dry-cleaning']));
        }
    });

    it('accepts repeated query parameters as well as a comma list', async () => {
        const csv = await get('/api/v1/partners?services=wash-fold,wash-iron');
        const repeated = await get('/api/v1/partners?services=wash-fold&services=wash-iron');
        expect((repeated.body as Page<Partner>).data.map((p) => p.id)).toEqual(
            (csv.body as Page<Partner>).data.map((p) => p.id)
        );
    });

    it('rejects service slugs outside the shared vocabulary', async () => {
        const { status, body } = await get('/api/v1/partners?services=made-up-service');

        expect(status).toBe(422);
        expect(body).toMatchObject({
            error: {
                code: 'VALIDATION_FAILED',
                fields: { 'services.0': expect.any(String) },
            },
        });
    });

    it('sorts by the cheapest thing a partner actually sells', async () => {
        const { body } = await get('/api/v1/partners?pincode=560103&sort=price');
        const prices = (body as Page<Partner>).data.map((p) => p.startingPrice?.amount ?? 0);

        expect(prices.length).toBeGreaterThan(1);
        expect(prices).toEqual([...prices].sort((a, b) => a - b));
    });

    it('filters by tag', async () => {
        const { body } = await get('/api/v1/partners?tags=eco-friendly');
        const page = body as Page<Partner>;
        expect(page.data.length).toBeGreaterThan(0);
        expect(page.data.every((p) => p.tags.includes('eco-friendly'))).toBe(true);
    });

    it('pages through every partner exactly once', async () => {
        const all = await get('/api/v1/partners');
        const expected = (all.body as Page<Partner>).data.map((p) => p.id);

        const seen: string[] = [];
        let cursor: string | null = null;
        do {
            const query: string = cursor
                ? `/api/v1/partners?limit=2&cursor=${encodeURIComponent(cursor)}`
                : '/api/v1/partners?limit=2';
            const { body } = await get(query);
            const page = body as Page<Partner>;
            expect(page.data.length).toBeLessThanOrEqual(2);
            seen.push(...page.data.map((p) => p.id));
            cursor = page.nextCursor;
        } while (cursor);

        expect(seen).toEqual(expected);
        expect(new Set(seen).size).toBe(seen.length);
    });

    it('rejects a malformed pincode with per-field messages', async () => {
        const { status, body } = await get('/api/v1/partners?pincode=12');
        expect(status).toBe(422);
        expect(body).toMatchObject({
            error: {
                code: 'VALIDATION_FAILED',
                fields: { pincode: 'Pincode must be 6 digits.' },
                requestId: expect.any(String),
            },
        });
    });

    it('requires latitude and longitude together', async () => {
        const { status, body } = await get('/api/v1/partners?latitude=12.9');
        expect(status).toBe(422);
        expect(body).toMatchObject({
            error: {
                code: 'VALIDATION_FAILED',
                fields: { longitude: 'Latitude and longitude must be supplied together.' },
            },
        });
    });

    it('requires an origin for distance sorting', async () => {
        const { status, body } = await get('/api/v1/partners?sort=distance');
        expect(status).toBe(422);
        expect(body).toMatchObject({
            error: {
                code: 'VALIDATION_FAILED',
                fields: { sort: 'Distance sorting requires a pincode or coordinates.' },
            },
        });
    });

    it('rejects a tampered cursor rather than returning arbitrary rows', async () => {
        const { status, body } = await get('/api/v1/partners?cursor=not-a-cursor');
        expect(status).toBe(422);
        expect(body).toMatchObject({ error: { code: 'VALIDATION_FAILED' } });
    });

    it('rejects a cursor replayed under a different sort', async () => {
        const first = await get('/api/v1/partners?limit=2&sort=rating');
        const cursor = (first.body as Page<Partner>).nextCursor!;

        const { status, body } = await get(
            `/api/v1/partners?limit=2&sort=price&cursor=${encodeURIComponent(cursor)}`
        );
        expect(status).toBe(422);
        expect(body).toMatchObject({ error: { code: 'VALIDATION_FAILED' } });
    });
});

describe('GET /api/v1/partners/:id', () => {
    it('returns the detail shape with opening hours', async () => {
        const { body: list } = await get('/api/v1/partners');
        const id = (list as Page<Partner>).data[0]!.id;

        const { status, body } = await get(`/api/v1/partners/${id}`);
        const partner = body as PartnerDetail;

        expect(status).toBe(200);
        expect(partner.id).toBe(id);
        expect(partner.openingHours).toHaveLength(7);
        expect(partner.openingHours[0]).toMatchObject({ weekday: 0 });
        // Times are `08:00`, not `08:00:00`, and null when the partner is shut.
        for (const hours of partner.openingHours) {
            if (hours.opensAt !== null) expect(hours.opensAt).toMatch(/^\d{2}:\d{2}$/);
            expect(hours.opensAt === null).toBe(hours.closesAt === null);
        }
    });

    it('reports no distance, because fetching one partner is not a search', async () => {
        const { body: list } = await get('/api/v1/partners?pincode=560103&sort=distance');
        const first = (list as Page<Partner>).data[0]!;

        // The listing measured from the searched pincode and found something.
        expect(first.distanceMeters).toEqual(expect.any(Number));

        const { body } = await get(`/api/v1/partners/${first.id}`);
        // The detail endpoint has no origin to measure from, and a distance from
        // the partner to itself is a number that means nothing.
        expect((body as PartnerDetail).distanceMeters).toBeNull();
    });

    it('404s an unknown partner with a code the UI can switch on', async () => {
        const { status, body } = await get('/api/v1/partners/ptr_nope');
        expect(status).toBe(404);
        expect(body).toMatchObject({ error: { code: 'PARTNER_NOT_FOUND' } });
    });
});

describe('GET /api/v1/partners/:id/catalog', () => {
    it('returns per-partner categories carrying both slug and partner name', async () => {
        const { status, body } = await get('/api/v1/partners/1003/catalog');
        const { categories } = body as {
            categories: { id: string; service: string; name: string; items: unknown[] }[];
        };

        expect(status).toBe(200);
        expect(categories.length).toBeGreaterThan(0);

        const dryClean = categories.find((c) => c.service === 'dry-cleaning');
        // The partner's own wording, kept apart from the platform's slug.
        expect(dryClean?.name).toBe('Express Dry Clean');
        expect(dryClean?.items.length).toBeGreaterThan(0);
    });

    it('prices every item in integer paise with a unit', async () => {
        const { body } = await get('/api/v1/partners/1001/catalog');
        const { categories } = body as {
            categories: {
                items: {
                    price: { amount: number; currency: string };
                    unit: string;
                    iconKey: string;
                }[];
            }[];
        };

        for (const item of categories.flatMap((c) => c.items)) {
            expect(Number.isInteger(item.price.amount)).toBe(true);
            expect(item.price.currency).toBe('INR');
            expect(item.unit).toBe('piece');
            // Icon keys, never emoji: the client owns the glyph.
            expect(item.iconKey).toMatch(/^[a-z-]+$/);
        }
    });

    it('charges different partners different prices for the same garment', async () => {
        const priceOf = async (partnerId: string) => {
            const { body } = await get(`/api/v1/partners/${partnerId}/catalog`);
            const { categories } = body as {
                categories: {
                    service: string;
                    items: { name: string; price: { amount: number } }[];
                }[];
            };
            const washFold = categories.find((c) => c.service === 'wash-fold');
            return washFold?.items.find((i) => i.name === 'Shirt / T-shirt')?.price.amount;
        };

        expect(await priceOf('1001')).toBe(2000);
        expect(await priceOf('1002')).toBe(1500);
        expect(await priceOf('1006')).toBe(1200);
    });

    it('404s an unknown partner', async () => {
        const { status, body } = await get('/api/v1/partners/ptr_nope/catalog');
        expect(status).toBe(404);
        expect(body).toMatchObject({ error: { code: 'PARTNER_NOT_FOUND' } });
    });
});

describe('GET /api/v1/partners/:id/slots', () => {
    it('returns days of slots as UTC instants, not display strings', async () => {
        const { status, body } = await get('/api/v1/partners/1001/slots?days=3');
        const { days } = body as {
            days: {
                date: string;
                slots: { id: string; startsAt: string; endsAt: string; available: boolean }[];
            }[];
        };

        expect(status).toBe(200);
        expect(days.length).toBeGreaterThan(0);

        for (const day of days) {
            expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            for (const slot of day.slots) {
                expect(slot.startsAt).toMatch(/Z$/);
                expect(new Date(slot.endsAt).getTime()).toBeGreaterThan(
                    new Date(slot.startsAt).getTime()
                );
                expect(typeof slot.available).toBe('boolean');
            }
        }
    });

    it('never offers a slot that has already started', async () => {
        const { body } = await get('/api/v1/partners/1001/slots?days=1');
        const { days } = body as { days: { slots: { startsAt: string; available: boolean }[] }[] };

        for (const slot of days.flatMap((d) => d.slots)) {
            if (new Date(slot.startsAt).getTime() <= Date.now()) {
                expect(slot.available).toBe(false);
            }
        }
    });

    it('rejects a window it will not serve', async () => {
        const { status, body } = await get('/api/v1/partners/1001/slots?days=90');
        expect(status).toBe(422);
        expect(body).toMatchObject({ error: { code: 'VALIDATION_FAILED' } });
    });

    it('rejects an impossible calendar date as a client error', async () => {
        const { status, body } = await get('/api/v1/partners/1001/slots?from=2026-02-31');
        expect(status).toBe(422);
        expect(body).toMatchObject({
            error: {
                code: 'VALIDATION_FAILED',
                fields: { from: 'Use a real calendar date.' },
            },
        });
    });
});
