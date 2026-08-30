import { PriceUnit } from './catalogModels';
import { Money } from './moneyModels';

/** Slugs, not display names. Labels live in listingConfig so copy can change freely. */
export type PartnerTag =
    | 'free-pickup'
    | 'eco-friendly'
    | 'same-day'
    | 'budget-friendly'
    | 'premium'
    | 'iron-fold'
    | 'bulk-discount';

export interface PartnerAddress {
    line1: string;
    line2: string;
    city: string;
    pincode: string;
}

export interface Partner {
    /** Opaque; names are not unique and ids are never parsed. */
    id: string;
    name: string;
    /** Null until the partner has been reviewed. */
    rating: number | null;
    reviewCount: number;
    address: PartnerAddress;
    /**
     * A property of this search rather than of the partner, and null when there
     * was no pin code to measure from.
     */
    distanceMeters: number | null;
    /** Server-owned slugs: it may send one the client has no label for. */
    tags: string[];
    services: string[];
    turnaroundHours: number;
    /** Derived server-side from the cheapest item the partner actually sells. */
    startingPrice: (Money & { unit: PriceUnit }) | null;
    isOpen: boolean;
    image: { url: string; alt: string } | null;
}

export interface OpeningHours {
    /** 0 = Sunday. Null times mean shut that day. */
    weekday: number;
    opensAt: string | null;
    closesAt: string | null;
}

export interface PartnerDetail extends Partner {
    about: string | null;
    openingHours: OpeningHours[];
}
