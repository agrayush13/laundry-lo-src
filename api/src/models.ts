/**
 * The wire shapes from docs/api-contract.md. These mirror the client's types in
 * ui/src/models and ui/src/data; when one moves the other has to follow, which
 * is the point of writing them down twice rather than inferring them.
 */
import type { Money } from './http/money.js';

export type PriceUnit = 'piece' | 'bag' | 'kg';

export type ServiceId = 'wash-fold' | 'wash-iron' | 'dry-cleaning' | 'premium-care';

export interface PartnerAddress {
    line1: string;
    line2: string;
    city: string;
    pincode: string;
}

export interface Partner {
    id: string;
    name: string;
    rating: number | null;
    reviewCount: number;
    address: PartnerAddress;
    /** A property of this search, not of the partner. Null when unknown. */
    distanceMeters: number | null;
    tags: string[];
    services: ServiceId[];
    turnaroundHours: number;
    startingPrice: (Money & { unit: PriceUnit }) | null;
    isOpen: boolean;
    image: { url: string; alt: string } | null;
}

export interface PartnerDetail extends Partner {
    about: string | null;
    openingHours: OpeningHours[];
}

export interface OpeningHours {
    /** 0 = Sunday. Null times mean shut that day. */
    weekday: number;
    opensAt: string | null;
    closesAt: string | null;
}

export interface CatalogItem {
    id: string;
    name: string;
    description: string | null;
    price: Money;
    unit: PriceUnit;
    iconKey: string;
}

export interface CatalogCategory {
    id: string;
    /** The platform's slug, which is what `services=` filters on. */
    service: ServiceId;
    /** The partner's own name for it. */
    name: string;
    items: CatalogItem[];
}

export interface Slot {
    id: string;
    startsAt: string;
    endsAt: string;
    available: boolean;
}

export interface SlotDay {
    date: string;
    slots: Slot[];
}

export interface Page<T> {
    data: T[];
    nextCursor: string | null;
}
