import { Page } from '../models/apiModels';
import { CatalogCategory } from '../models/catalogModels';
import { Partner, PartnerDetail } from '../models/partnerModels';
import { Slot, SlotDay } from '../models/slotModels';
import { ORDERS, getOrder } from '../data/orders';
import { upcomingDates } from '../utils/datesUtils';
import partnerFixtures from '../../../fixtures/partners.json';

/**
 * A stand-in for the API, serving the same Bengaluru demo set as
 * `supabase/seed.sql`. The tests drive real user journeys, so they need
 * responses in the contract's shapes rather than a stubbed hook - but they must
 * not need a database to run.
 *
 * Where this and the server can disagree, the API's own integration tests are
 * the authority; this exists so the UI's states can be exercised offline.
 */
const rupees = (value: number) => ({ amount: value * 100, currency: 'INR' as const });

interface Seed {
    id: string;
    name: string;
    rating: number;
    reviewCount: number;
    line1: string;
    line2: string;
    pincode: string;
    distanceMeters: number;
    tags: string[];
    services: string[];
    turnaroundHours: number;
    isOpen: boolean;
    /** The per-partner multiplier the seed applies to one base rate card. */
    factor: number;
    startingPriceAmount: number;
}

const SEEDS: Seed[] = partnerFixtures;

const BASE_CATALOG: Record<string, { name: string; items: [string, string, number, string][] }> = {
    'wash-fold': {
        name: 'Wash & Fold',
        items: [
            ['wf-shirt', 'Shirt / T-shirt', 20, 'shirt'],
            ['wf-trousers', 'Trousers / Jeans', 30, 'box'],
            ['wf-bedsheet', 'Bedsheet', 60, 'bed'],
            ['wf-towel', 'Towel', 25, 'sparkles'],
        ],
    },
    'wash-iron': {
        name: 'Wash & Iron',
        items: [
            ['wi-shirt', 'Shirt / T-shirt', 30, 'shirt'],
            ['wi-trousers', 'Trousers / Jeans', 40, 'box'],
            ['wi-kurta', 'Kurta / Ethnic Wear', 45, 'star'],
        ],
    },
    'dry-cleaning': {
        name: 'Dry Cleaning',
        items: [
            ['dc-jacket', 'Jacket / Coat', 199, 'box'],
            ['dc-suit', 'Suit (2 piece)', 349, 'crown'],
            ['dc-saree', 'Saree', 249, 'star'],
        ],
    },
    'premium-care': {
        name: 'Premium Care',
        items: [
            ['pc-saree', 'Silk Saree', 349, 'star'],
            ['pc-lehenga', 'Lehenga', 599, 'crown'],
        ],
    },
};

/** As in the seed: the partner may name a category in its own words. */
const CATEGORY_NAMES: Record<string, string> = {
    '1003:dry-cleaning': 'Express Dry Clean',
    '1003:premium-care': 'Luxury & Couture',
};

const catalogFor = (seed: Seed): CatalogCategory[] =>
    seed.services.map((service) => {
        const base = BASE_CATALOG[service]!;
        return {
            id: `cat_${seed.id}_${service}`,
            service,
            name: CATEGORY_NAMES[`${seed.id}:${service}`] ?? base.name,
            items: base.items.map(([id, name, price, iconKey]) => ({
                id: `itm_${seed.id}_${id}`,
                name,
                description: `${name}, handled by ${seed.name}.`,
                price: rupees(Math.round(price * seed.factor)),
                unit: 'piece' as const,
                iconKey,
            })),
        };
    });

const startingPrice = (seed: Seed) => {
    const prices = catalogFor(seed).flatMap((category) =>
        category.items.map((item) => item.price.amount)
    );
    // Derived from the catalogue, exactly as the server derives it.
    if (prices.length === 0) return null;

    const amount = Math.min(...prices);
    if (amount !== seed.startingPriceAmount) {
        throw new Error(
            `Partner fixture ${seed.id} advertises ${seed.startingPriceAmount} but its catalogue starts at ${amount}.`
        );
    }

    return { amount, currency: 'INR' as const, unit: 'piece' as const };
};

const toPartner = (seed: Seed, withDistance: boolean): Partner => ({
    id: seed.id,
    name: seed.name,
    rating: seed.rating,
    reviewCount: seed.reviewCount,
    address: {
        line1: seed.line1,
        line2: seed.line2,
        city: 'Bengaluru',
        pincode: seed.pincode,
    },
    distanceMeters: withDistance ? seed.distanceMeters : null,
    tags: seed.tags,
    services: seed.services,
    turnaroundHours: seed.turnaroundHours,
    startingPrice: startingPrice(seed),
    isOpen: seed.isOpen,
    image: { url: `https://images.example/${seed.id}.jpg`, alt: `${seed.name} storefront` },
});

const toDetail = (seed: Seed): PartnerDetail => ({
    // No distance: fetching one partner by id is not a search, so there is no
    // origin to measure from. The server returns null here for the same reason.
    ...toPartner(seed, false),
    about: `${seed.name} has been washing for the neighbourhood for years.`,
    openingHours: Array.from({ length: 7 }, (_, weekday) => ({
        weekday,
        opensAt: weekday === 0 ? null : '08:00',
        closesAt: weekday === 0 ? null : '20:00',
    })),
});

/** Two-hour windows, as `generate_slots` produces from opening hours. */
const slotsForDay = (partnerId: string, date: string, dayIndex: number): Slot[] =>
    Array.from({ length: 6 }, (_, index) => {
        const hour = 8 + index * 2;
        const startsAt = new Date(`${date}T${String(hour).padStart(2, '0')}:00:00+05:30`);
        const endsAt = new Date(startsAt.getTime() + 2 * 60 * 60 * 1000);

        return {
            id: `slt_${partnerId}_${date}_${hour}`,
            startsAt: startsAt.toISOString(),
            endsAt: endsAt.toISOString(),
            // One full slot on the first day, so the disabled state has
            // something real to render. Everything else is open, because a
            // fixture that drifted with the clock would fail by time of day.
            available: !(dayIndex === 0 && index === 1),
        };
    });

const slotDays = (partnerId: string, days: number): SlotDay[] =>
    upcomingDates(days).map((date, dayIndex) => ({
        date,
        slots: slotsForDay(partnerId, date, dayIndex),
    }));

const SORTERS: Record<string, (a: Seed, b: Seed) => number> = {
    rating: (a, b) => b.rating - a.rating,
    distance: (a, b) => a.distanceMeters - b.distanceMeters,
    turnaround: (a, b) => a.turnaroundHours - b.turnaroundHours,
    price: (a, b) => (startingPrice(a)?.amount ?? 0) - (startingPrice(b)?.amount ?? 0),
};

const splitList = (value: string | null) => (value ? value.split(',').filter(Boolean) : []);

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });

const errorResponse = (code: string, message: string, status: number) =>
    json({ error: { code, message, requestId: 'test-request' } }, status);

const listResponse = (url: URL) => {
    const pincode = url.searchParams.get('pincode');
    const services = splitList(url.searchParams.get('services'));
    const tags = splitList(url.searchParams.get('tags'));
    const sort = url.searchParams.get('sort') ?? 'rating';
    const limit = Number(url.searchParams.get('limit') ?? 20);
    const cursor = url.searchParams.get('cursor');

    if (pincode && !/^\d{6}$/.test(pincode)) {
        return errorResponse('VALIDATION_FAILED', 'Pincode must be 6 digits.', 422);
    }

    const matched = SEEDS.filter(
        (seed) =>
            (!pincode || seed.pincode === pincode) &&
            // Conjunctive, as the API is: every service and tag must be present.
            services.every((service) => seed.services.includes(service)) &&
            tags.every((tag) => seed.tags.includes(tag))
    ).sort(SORTERS[sort] ?? SORTERS['rating']!);

    const offset = cursor ? Number(Buffer.from(cursor, 'base64url').toString('utf8')) : 0;
    const page = matched.slice(offset, offset + limit);
    const nextOffset = offset + page.length;

    const body: Page<Partner> = {
        data: page.map((seed) => toPartner(seed, Boolean(pincode))),
        nextCursor:
            nextOffset < matched.length
                ? Buffer.from(String(nextOffset), 'utf8').toString('base64url')
                : null,
    };
    return json(body);
};

/**
 * Routes a request to the fixture. Exported so a test can wrap it - to make one
 * endpoint fail, for instance - without restating the rest.
 */
export const fixtureFetch = (input: RequestInfo | URL): Response => {
    const url = new URL(String(input), 'http://localhost');
    const path = url.pathname.replace('/api/v1', '');

    if (path === '/partners') {
        return listResponse(url);
    }

    if (path === '/orders') {
        return json({ data: ORDERS, nextCursor: null });
    }

    const orderMatch = /^\/orders\/([^/]+)$/.exec(path);
    if (orderMatch) {
        const order = getOrder(decodeURIComponent(orderMatch[1]!));
        return order ? json(order) : errorResponse('NOT_FOUND', 'That order was not found.', 404);
    }

    const match = /^\/partners\/([^/]+)(\/catalog|\/slots)?$/.exec(path);
    if (!match) {
        return errorResponse('NOT_FOUND', 'No such endpoint.', 404);
    }

    const seed = SEEDS.find((candidate) => candidate.id === decodeURIComponent(match[1]!));
    if (!seed) {
        return errorResponse('PARTNER_NOT_FOUND', 'That laundry is no longer listed.', 404);
    }

    if (match[2] === '/catalog') {
        return json({ categories: catalogFor(seed) });
    }

    if (match[2] === '/slots') {
        const days = Number(url.searchParams.get('days') ?? 7);
        return json({ days: slotDays(seed.id, days) });
    }

    return json(toDetail(seed));
};

/** Installs the fixture as `fetch` for the current test. */
export const installApiFixture = () => {
    const stub = vi.fn((input: RequestInfo | URL) => Promise.resolve(fixtureFetch(input)));
    vi.stubGlobal('fetch', stub);
    return stub;
};

/** Every request fails the way a dropped connection does. */
export const installOfflineFixture = () => {
    vi.stubGlobal(
        'fetch',
        vi.fn(() => Promise.reject(new TypeError('Failed to fetch')))
    );
};

export const FIXTURE_PARTNERS = SEEDS;
