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

export interface PartnerConfiguration {
    id: string;
    name: string;
    about: string;
    address: PartnerAddress;
    /** Exact pincodes where this laundry currently accepts customer orders. */
    servicePincodes: string[];
    /** Today and future exceptional closure dates in the laundry's local zone. */
    holidayClosures: HolidayClosure[];
    /** Today and future per-slot limits for exceptional operating dates. */
    capacityOverrides: CapacityOverride[];
    turnaroundHours: number;
    /** Manual master switch controlled by the laundry owner. */
    acceptingOrders: boolean;
    /** When true, acceptingOrders is also constrained by openingHours. */
    useOpeningHours: boolean;
    /** Effective state after the manual switch and current schedule are applied. */
    currentlyOpen: boolean;
    openingHours: OpeningHours[];
}

export interface HolidayClosure {
    date: string;
    reason: string;
}

export interface CapacityOverride {
    date: string;
    capacity: number;
    note: string;
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

export interface PartnerCatalogItem extends CatalogItem {
    isActive: boolean;
}

export interface PartnerCatalogCategory {
    id: string;
    service: ServiceId;
    name: string;
    items: PartnerCatalogItem[];
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

export interface Preferences {
    sms: boolean;
    email: boolean;
}

export interface Profile {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    memberSince: string;
    preferences: Preferences;
}

export interface SavedAddress {
    id: string;
    label: string;
    recipientName: string;
    phone: string;
    building: string;
    street: string;
    landmark: string;
    pincode: string;
    isDefault: boolean;
}

export interface CartLine {
    itemId: string;
    name: string;
    description: string | null;
    categoryName: string;
    iconKey: string;
    quantity: number;
    unit: PriceUnit;
    unitPrice: Money;
    lineTotal: Money;
}

export interface CartTotals {
    subtotal: Money;
    delivery: Money;
    membership: Money;
    discount: Money;
    tax: Money;
    total: Money;
}

export interface Cart {
    id: string | null;
    partner: { id: string; name: string } | null;
    items: CartLine[];
    membership: {
        plan: 'plus';
        price: Money;
        period: 'month';
    } | null;
    totals: CartTotals;
}

export interface MembershipPlan {
    id: 'plus';
    name: string;
    price: Money;
    period: 'month';
    benefits: string[];
}

export interface MembershipStatus {
    plan: 'plus';
    startedAt: string;
    renewsAt: string;
    isActive: boolean;
}

export type OrderStatus = 'processing' | 'out_for_delivery' | 'delivered' | 'cancelled';
export type OrderEventType =
    | 'placed'
    | 'confirmed'
    | 'picked_up'
    | 'in_progress'
    | 'out_for_delivery'
    | 'delivered'
    | 'cancelled';

export interface Order {
    id: string;
    reference: string;
    status: OrderStatus;
    canCancel: boolean;
    placedAt: string;
    partner: { id: string; name: string };
    lines: Array<{
        itemId: string;
        name: string;
        quantity: number;
        unit: PriceUnit;
        amount: Money;
    }>;
    totals: CartTotals;
    deliveryAddress: {
        label: string;
        recipientName: string;
        phone: string;
        building: string;
        street: string;
        landmark: string;
        pincode: string;
    };
    pickup: { date: string; startsAt: string; endsAt: string };
    delivery: { date: string; startsAt: string; endsAt: string };
    events: Array<{ type: OrderEventType; occurredAt: string }>;
}

export interface PartnerOrderSummary {
    id: string;
    reference: string;
    status: OrderStatus;
    placedAt: string;
    partner: { id: string; name: string };
    recipient: { name: string; pincode: string };
    itemCount: number;
    total: Money;
    pickup: { startsAt: string; endsAt: string };
    delivery: { startsAt: string; endsAt: string };
    latestEvent: { type: OrderEventType; occurredAt: string };
}
