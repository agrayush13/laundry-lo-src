import { Money, rupees } from '../models/moneyModels';
import { unsplashImage } from '../utils/imagesUtils';
import { PriceUnit } from './menu';
import { ServiceId } from './services';

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
    /** Stable identifier used in URLs; names are not unique. */
    id: string;
    name: string;
    rating: number;
    reviewCount: number;
    address: PartnerAddress;
    /** A property of this search, not of the partner. Integer metres. */
    distanceMeters: number;
    tags: PartnerTag[];
    /**
     * The services this partner actually offers. The API derives it from the
     * partner's catalogue categories, so it cannot drift from what they sell;
     * here it is seeded. See docs/api-contract.md decision 8.
     */
    services: ServiceId[];
    turnaroundHours: number;
    startingPrice: Money & { unit: PriceUnit };
    isOpen: boolean;
    image: { url: string; alt: string };
}

const startingAt = (value: number): Money & { unit: PriceUnit } => ({
    ...rupees(value),
    unit: 'piece',
});

export const PARTNERS: Partner[] = [
    {
        id: '1001',
        name: 'SparkleWash Express',
        rating: 4.9,
        reviewCount: 234,
        address: { line1: '12, MG Road', line2: 'Sector 5', city: 'Bengaluru', pincode: '560103' },
        distanceMeters: 800,
        tags: ['free-pickup', 'eco-friendly'],
        services: ['wash-fold', 'wash-iron', 'dry-cleaning'],
        turnaroundHours: 24,
        startingPrice: startingAt(20),
        isOpen: true,
        image: {
            url: unsplashImage('photo-1517677208171-0bc6725a3e60', 600),
            alt: 'Front-loading washing machines in a bright laundromat',
        },
    },
    {
        id: '1002',
        name: 'CleanFold Laundry',
        rating: 4.7,
        reviewCount: 189,
        address: {
            line1: '45, Park Street',
            line2: 'Block B',
            city: 'Bengaluru',
            pincode: '560103',
        },
        distanceMeters: 1200,
        tags: ['budget-friendly'],
        services: ['wash-fold', 'wash-iron'],
        turnaroundHours: 48,
        startingPrice: startingAt(15),
        isOpen: true,
        image: {
            url: unsplashImage('photo-1582735689369-4fe89db7114c', 600),
            alt: 'A person holding a stack of folded knitwear',
        },
    },
    {
        id: '1003',
        name: 'Royal Dry Cleaners',
        rating: 4.8,
        reviewCount: 312,
        address: {
            line1: '8, Civil Lines',
            line2: 'Main Market',
            city: 'Bengaluru',
            pincode: '560102',
        },
        distanceMeters: 1500,
        tags: ['premium', 'same-day'],
        services: ['dry-cleaning', 'premium-care'],
        turnaroundHours: 24,
        startingPrice: startingAt(30),
        isOpen: true,
        image: {
            url: unsplashImage('photo-1489274495757-95c7c837b101', 600),
            alt: 'A laundry basket filled with clothes',
        },
    },
    {
        id: '1004',
        name: 'FreshPress Studio',
        rating: 4.6,
        reviewCount: 98,
        address: { line1: '22, Station Road', line2: '', city: 'Bengaluru', pincode: '560102' },
        distanceMeters: 2100,
        tags: ['iron-fold', 'free-pickup'],
        services: ['wash-iron', 'wash-fold'],
        turnaroundHours: 36,
        startingPrice: startingAt(18),
        isOpen: false,
        image: {
            url: unsplashImage('photo-1604176354204-9268737828e4', 600),
            alt: 'A steam iron pressing a shirt',
        },
    },
    {
        id: '1005',
        name: 'AquaClean Services',
        rating: 4.5,
        reviewCount: 156,
        address: {
            line1: '67, Green Avenue',
            line2: 'Phase 2',
            city: 'Bengaluru',
            pincode: '560103',
        },
        distanceMeters: 2800,
        tags: ['eco-friendly', 'premium'],
        services: ['wash-fold', 'dry-cleaning', 'premium-care'],
        turnaroundHours: 24,
        startingPrice: startingAt(25),
        isOpen: true,
        image: {
            url: unsplashImage('photo-1610557892470-55d9e80c0bce', 600),
            alt: 'Clothes tumbling inside a washing machine drum',
        },
    },
    {
        id: '1006',
        name: 'QuickWash Hub',
        rating: 4.4,
        reviewCount: 73,
        address: { line1: '101, Industrial Area', line2: '', city: 'Bengaluru', pincode: '560104' },
        distanceMeters: 3200,
        tags: ['budget-friendly', 'bulk-discount'],
        services: ['wash-fold'],
        turnaroundHours: 48,
        startingPrice: startingAt(12),
        isOpen: true,
        image: {
            url: unsplashImage('photo-1545173168-9f1947eebb7f', 600),
            alt: 'Industrial washing machines lined up in a row',
        },
    },
];

export const getPartner = (id: string) => PARTNERS.find((partner) => partner.id === id);
