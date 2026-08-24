import { Partner, PartnerTag } from '../data/partners';

export type SortKey = 'relevance' | 'rating' | 'price' | 'distance';

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'rating', label: 'Rating' },
    { value: 'price', label: 'Price: Low to High' },
    { value: 'distance', label: 'Distance' },
];

export const SORTERS: Record<SortKey, (a: Partner, b: Partner) => number> = {
    relevance: () => 0,
    rating: (a, b) => b.rating - a.rating,
    price: (a, b) => a.startingPrice.amount - b.startingPrice.amount,
    distance: (a, b) => a.distanceMeters - b.distanceMeters,
};

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

export const LISTING_COPY = {
    back: 'Back to home',
    titlePrefix: 'Laundry services near',
    titleFallback: 'you',
    countSuffix: 'found • Showing verified partners only',
    filtersLabel: 'Filters',
    clearFilters: 'Clear',
    sortLabel: 'Sort by',
    sortPrefix: 'Sort:',
    empty: 'No partners match those filters. Try clearing one to see more results.',
    startingFrom: 'Starting from',
    closed: 'Currently Closed',
    book: 'Book Now',
    mapTitle: 'Map View',
    mapSubtitle: 'Interactive map coming soon',
    freeDelivery: 'Free pickup & delivery',
    verified: 'Verified partner',
    turnaroundSuffix: 'h turnaround',
} as const;
