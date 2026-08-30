import type {
    CatalogCategory,
    OpeningHours,
    Partner,
    PartnerDetail,
    PriceUnit,
    SlotDay,
} from '../models.js';
import type {
    CatalogRow,
    OpeningHoursRow,
    PartnerRow,
    SlotRow,
} from '../queries/partnerQueries.js';
import { money, moneyWithUnit } from './money.js';

/**
 * Rows in, contract shapes out. Every snake_case column becomes camelCase here
 * and nowhere else, so a column rename cannot reach the client.
 */
export const toPartner = (row: PartnerRow): Partner => ({
    id: row.id,
    name: row.name,
    rating: row.rating,
    reviewCount: row.review_count,
    address: {
        line1: row.line1,
        line2: row.line2,
        city: row.city,
        pincode: row.pincode,
    },
    distanceMeters: row.distance_meters,
    tags: row.tags,
    services: row.services,
    turnaroundHours: row.turnaround_hours,
    startingPrice:
        row.starting_price === null
            ? null
            : moneyWithUnit(row.starting_price, (row.starting_unit ?? 'piece') as PriceUnit),
    isOpen: row.is_open,
    image: row.image_url ? { url: row.image_url, alt: row.image_alt ?? '' } : null,
});

export const toPartnerDetail = (row: PartnerRow, hours: OpeningHoursRow[]): PartnerDetail => ({
    ...toPartner(row),
    about: row.about,
    openingHours: hours.map((hour): OpeningHours => ({
        weekday: hour.weekday,
        // `08:00:00` is storage detail; the client wants `08:00`.
        opensAt: hour.opens_at ? hour.opens_at.slice(0, 5) : null,
        closesAt: hour.closes_at ? hour.closes_at.slice(0, 5) : null,
    })),
});

export const toCatalog = (rows: CatalogRow[]): CatalogCategory[] => {
    const categories = new Map<string, CatalogCategory>();

    for (const row of rows) {
        let category = categories.get(row.category_id);
        if (!category) {
            category = {
                id: row.category_id,
                service: row.service,
                name: row.category_name,
                items: [],
            };
            categories.set(row.category_id, category);
        }
        // The left join yields one null-item row for an empty category.
        if (row.item_id) {
            category.items.push({
                id: row.item_id,
                name: row.item_name ?? '',
                description: row.description,
                price: money(row.price ?? 0, row.currency ?? 'INR'),
                unit: (row.unit ?? 'piece') as PriceUnit,
                iconKey: row.icon_key ?? 'shirt',
            });
        }
    }

    return [...categories.values()];
};

export const toSlotDays = (rows: SlotRow[]): SlotDay[] => {
    const days = new Map<string, SlotDay>();

    for (const row of rows) {
        let day = days.get(row.day);
        if (!day) {
            day = { date: row.day, slots: [] };
            days.set(row.day, day);
        }
        day.slots.push({
            id: row.id,
            // ISO 8601 UTC. No pre-formatted display strings ever leave here.
            startsAt: row.starts_at.toISOString(),
            endsAt: row.ends_at.toISOString(),
            available: row.available,
        });
    }

    return [...days.values()];
};
