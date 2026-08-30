import type { Client } from '../db/pool.js';
import type { Cursor } from '../http/pagination.js';
import type { ServiceId } from '../models.js';

export interface PartnerRow {
    id: string;
    name: string;
    about: string | null;
    rating: number | null;
    review_count: number;
    line1: string;
    line2: string;
    city: string;
    pincode: string;
    turnaround_hours: number;
    image_url: string | null;
    image_alt: string | null;
    tags: string[];
    services: ServiceId[];
    starting_price: number | null;
    starting_unit: string | null;
    is_open: boolean;
    distance_meters: number | null;
    sort_key: number;
}

export type PartnerSort = 'rating' | 'distance' | 'turnaround' | 'price';

export interface ListPartnersParams {
    pincode?: string | undefined;
    latitude?: number | undefined;
    longitude?: number | undefined;
    services?: string[] | undefined;
    tags?: string[] | undefined;
    sort: PartnerSort;
    limit: number;
    cursor: Cursor | null;
}

/** Larger than any real distance in metres, so unknown distances sort last. */
const UNKNOWN_DISTANCE = 2_147_483_647;

/** Likewise for a partner whose catalogue has no active item to price. */
const UNKNOWN_PRICE = 2_147_483_647;

// Ascending sorts page forward with `>`, the descending one with `<`; the id is
// the tiebreak in both, which is what stops a page boundary from repeating or
// skipping partners that share a rating.
const SORTS: Record<PartnerSort, { key: string; order: string; comparison: '<' | '>' }> = {
    rating: { key: 'coalesce(rating, 0)', order: 'sort_key desc, id asc', comparison: '<' },
    distance: {
        key: `coalesce(distance_meters, ${UNKNOWN_DISTANCE})`,
        order: 'sort_key asc, id asc',
        comparison: '>',
    },
    turnaround: { key: 'turnaround_hours', order: 'sort_key asc, id asc', comparison: '>' },
    // A partner with no priceable catalogue sorts last rather than first.
    price: {
        key: `coalesce(starting_price, ${UNKNOWN_PRICE})`,
        order: 'sort_key asc, id asc',
        comparison: '>',
    },
};

export const listPartners = async (
    client: Client,
    params: ListPartnersParams
): Promise<PartnerRow[]> => {
    const sort = SORTS[params.sort];
    const values: unknown[] = [
        params.latitude ?? null,
        params.longitude ?? null,
        params.pincode ?? null,
        params.services ?? null,
        params.tags ?? null,
    ];

    // One extra row answers "is there a next page" without a second count query.
    const limitParam = values.push(params.limit + 1);

    let keyset = '';
    if (params.cursor) {
        const keyParam = values.push(params.cursor.key);
        const idParam = values.push(params.cursor.id);
        keyset = `where sort_key ${sort.comparison} $${keyParam}
                     or (sort_key = $${keyParam} and id > $${idParam})`;
    }

    const { rows } = await client.query<PartnerRow>(
        `
        with origin as (
            -- Explicit coordinates win; otherwise a search by pincode is
            -- measured from that pincode's centroid.
            select
                coalesce($1::numeric, (
                    select latitude from public.pincode_centroids where pincode = $3
                )) as lat,
                coalesce($2::numeric, (
                    select longitude from public.pincode_centroids where pincode = $3
                )) as lon
        ),
        listing as (
            select
                d.id, d.name, d.about, d.rating::double precision as rating, d.review_count,
                d.line1, d.line2, d.city, d.pincode, d.turnaround_hours,
                d.image_url, d.image_alt, d.tags, d.services,
                d.starting_price, d.starting_unit,
                public.is_partner_open(d.id) as is_open,
                public.haversine_meters(o.lat, o.lon, d.latitude, d.longitude) as distance_meters
            from public.partner_details d
            cross join origin o
            where ($3::text is null or d.pincode = $3)
              -- Conjunctive: @> means the partner offers all of them, not any.
              and ($4::text[] is null or d.services @> $4)
              and ($5::text[] is null or d.tags @> $5)
        ),
        keyed as (
            select listing.*, ${sort.key} as sort_key from listing
        )
        select * from keyed
        ${keyset}
        order by ${sort.order}
        limit $${limitParam}
        `,
        values
    );
    return rows;
};

/**
 * `distance_meters` is null here, and deliberately so: it is a property of a
 * search, and fetching one partner by id is not a search. This used to measure
 * from the partner's own pincode centroid to the partner's own coordinates,
 * which is a real number that means nothing - and because the listing card and
 * the partner page render through the same component, the same shop reported one
 * distance in the list and a different one when you tapped it.
 */
export const getPartner = async (client: Client, id: string): Promise<PartnerRow | null> => {
    const { rows } = await client.query<PartnerRow>(
        `
        select
            d.id, d.name, d.about, d.rating::double precision as rating, d.review_count,
            d.line1, d.line2, d.city, d.pincode, d.turnaround_hours,
            d.image_url, d.image_alt, d.tags, d.services,
            d.starting_price, d.starting_unit,
            public.is_partner_open(d.id) as is_open,
            null::integer as distance_meters,
            0 as sort_key
        from public.partner_details d
        where d.id = $1
        `,
        [id]
    );
    return rows[0] ?? null;
};

/**
 * Existence only, for the endpoints that need a 404 and nothing else. `getPartner`
 * aggregates tags and catalogue items and calls `is_partner_open` just to have
 * every column thrown away.
 */
export const partnerExists = async (client: Client, id: string): Promise<boolean> => {
    const { rowCount } = await client.query('select 1 from public.partners where id = $1', [id]);
    return rowCount === 1;
};

export interface OpeningHoursRow {
    weekday: number;
    opens_at: string | null;
    closes_at: string | null;
}

export const getOpeningHours = async (
    client: Client,
    partnerId: string
): Promise<OpeningHoursRow[]> => {
    const { rows } = await client.query<OpeningHoursRow>(
        `select weekday, opens_at::text, closes_at::text
         from public.partner_hours where partner_id = $1 order by weekday`,
        [partnerId]
    );
    return rows;
};

export interface CatalogRow {
    category_id: string;
    service: ServiceId;
    category_name: string;
    item_id: string | null;
    item_name: string | null;
    description: string | null;
    price: number | null;
    currency: string | null;
    unit: string | null;
    icon_key: string | null;
}

export const getCatalog = async (client: Client, partnerId: string): Promise<CatalogRow[]> => {
    const { rows } = await client.query<CatalogRow>(
        `
        select
            c.id as category_id, c.service, c.name as category_name,
            i.id as item_id, i.name as item_name, i.description,
            i.price, i.currency, i.unit, i.icon_key
        from public.catalog_categories c
        left join public.catalog_items i on i.category_id = c.id and i.is_active
        where c.partner_id = $1
        order by c.position, c.id, i.position, i.id
        `,
        [partnerId]
    );
    return rows;
};

export interface SlotRow {
    id: string;
    day: string;
    starts_at: Date;
    ends_at: Date;
    available: boolean;
}

export const getSlots = async (
    client: Client,
    partnerId: string,
    from: string,
    days: number
): Promise<SlotRow[]> => {
    const { rows } = await client.query<SlotRow>(
        `
        select
            id,
            to_char(timezone('Asia/Kolkata', starts_at), 'YYYY-MM-DD') as day,
            starts_at,
            ends_at,
            -- A slot in the past is as unbookable as a full one, and saying so
            -- is the client's only way to stop offering it.
            (state = 'open' and booked < capacity and starts_at > now()) as available
        from public.slots
        where partner_id = $1
          and starts_at >= timezone('Asia/Kolkata', $2::date::timestamp)
          and starts_at <  timezone('Asia/Kolkata', ($2::date + $3::int)::timestamp)
        order by starts_at
        `,
        [partnerId, from, days]
    );
    return rows;
};
