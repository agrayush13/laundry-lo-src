import { PartnerTag } from '../models/partnerModels';
import { PartnerSort } from '../services/partnerServices';

/**
 * Sort keys are the API's own parameters rather than a client vocabulary that
 * has to be translated. The list has no "relevance" any more: it sorted nothing,
 * and every other option here is a real ordering the server can perform.
 */
export type SortKey = Extract<PartnerSort, 'rating' | 'price' | 'distance'>;

export const DEFAULT_SORT: SortKey = 'rating';

/** One request's worth of partners; the rest arrive behind Show more. */
export const PARTNER_PAGE_SIZE = 20;

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
    { value: 'rating', label: 'Rating' },
    { value: 'price', label: 'Price: Low to High' },
    { value: 'distance', label: 'Distance' },
];

export const availableSortOptions = (hasLocation: boolean) =>
    hasLocation ? SORT_OPTIONS : SORT_OPTIONS.filter(({ value }) => value !== 'distance');

/** The API sends tag slugs; display names are the client's business. */
export const TAG_LABELS: Record<PartnerTag, string> = {
    'free-pickup': 'Free Pickup',
    'eco-friendly': 'Eco-Friendly',
    'same-day': 'Same Day',
    'budget-friendly': 'Budget Friendly',
    premium: 'Premium',
    'iron-fold': 'Iron & Fold',
    'bulk-discount': 'Bulk Discount',
};

export const TAG_SLUGS = Object.keys(TAG_LABELS) as PartnerTag[];

/**
 * A partner may carry a tag added server-side before this client shipped a label
 * for it. Showing the slug is worse than a label and far better than a blank.
 */
export const tagLabel = (tag: string) => TAG_LABELS[tag as PartnerTag] ?? tag;

export const LISTING_COPY = {
    back: 'Back to home',
    titlePrefix: 'Laundry services near',
    titleFallback: 'you',
    countSuffix: 'found • Showing verified partners only',
    loading: 'Loading laundries',
    filtersLabel: 'Filters',
    clearFilters: 'Clear',
    clearService: 'Remove service filter',
    sortLabel: 'Sort by',
    sortPrefix: 'Sort:',
    empty: 'No partners match those filters. Try clearing one to see more results.',
    emptyForPin: 'No partners deliver to that pin code yet. Try another one.',
    startingFrom: 'Starting from',
    priceUnknown: 'Price on request',
    closed: 'Currently Closed',
    book: 'Book Now',
    mapTitle: 'Map View',
    mapSubtitle: 'Interactive map coming soon',
    freeDelivery: 'Free pickup & delivery',
    verified: 'Verified partner',
    turnaroundSuffix: 'h turnaround',
    ratingUnknown: 'Not yet rated',
    showMore: 'Show more',
    showingMore: 'Loading more',
    showMoreFailed: "We couldn't load any more just now.",
} as const;
