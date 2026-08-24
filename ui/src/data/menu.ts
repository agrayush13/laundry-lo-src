import { Money, rupees } from '../models/moneyModels';
import { IconName } from '../common-ui/icons/registry';

/**
 * Pricing is per item, so a line total is always known at checkout. `bag` and
 * `kg` exist because the API contract reserves them, but nothing ships with
 * them until there are real bags and scales behind the counter.
 */
export type PriceUnit = 'piece' | 'bag' | 'kg';

export interface MenuItem {
    id: string;
    name: string;
    description: string;
    price: Money;
    unit: PriceUnit;
    iconKey: IconName;
}

export interface MenuCategory {
    id: string;
    name: string;
    items: MenuItem[];
}

/** The service is part of the item, so the same garment appears at several prices. */
export const PARTNER_MENU: MenuCategory[] = [
    {
        id: 'wash-fold',
        name: 'Wash & Fold',
        items: [
            {
                id: 'wf-shirt',
                name: 'Shirt / T-shirt',
                description: 'Machine washed with premium detergent, neatly folded',
                price: rupees(20),
                unit: 'piece',
                iconKey: 'shirt',
            },
            {
                id: 'wf-trousers',
                name: 'Trousers / Jeans',
                description: 'Machine washed and folded, ready to wear',
                price: rupees(30),
                unit: 'piece',
                iconKey: 'box',
            },
            {
                id: 'wf-bedsheet',
                name: 'Bedsheet',
                description: 'Single or double, washed and pressed flat',
                price: rupees(60),
                unit: 'piece',
                iconKey: 'bed',
            },
            {
                id: 'wf-towel',
                name: 'Towel',
                description: 'Washed on a hot cycle and tumble dried',
                price: rupees(25),
                unit: 'piece',
                iconKey: 'sparkles',
            },
        ],
    },
    {
        id: 'wash-iron',
        name: 'Wash & Iron',
        items: [
            {
                id: 'wi-shirt',
                name: 'Shirt / T-shirt',
                description: 'Washed, then professionally pressed',
                price: rupees(30),
                unit: 'piece',
                iconKey: 'shirt',
            },
            {
                id: 'wi-trousers',
                name: 'Trousers / Jeans',
                description: 'Washed and pressed with a sharp crease',
                price: rupees(40),
                unit: 'piece',
                iconKey: 'box',
            },
            {
                id: 'wi-kurta',
                name: 'Kurta / Ethnic Wear',
                description: 'Gentle wash and press for everyday ethnic wear',
                price: rupees(45),
                unit: 'piece',
                iconKey: 'star',
            },
        ],
    },
    {
        id: 'dry-clean',
        name: 'Dry Cleaning',
        items: [
            {
                id: 'dc-jacket',
                name: 'Jacket / Coat',
                description: 'Solvent cleaned and finished on a form press',
                price: rupees(199),
                unit: 'piece',
                iconKey: 'box',
            },
            {
                id: 'dc-suit',
                name: 'Suit (2 piece)',
                description: 'Jacket and trousers cleaned together',
                price: rupees(349),
                unit: 'piece',
                iconKey: 'crown',
            },
            {
                id: 'dc-saree',
                name: 'Saree',
                description: 'Delicate handling for silk and embroidery',
                price: rupees(249),
                unit: 'piece',
                iconKey: 'star',
            },
        ],
    },
    {
        id: 'iron',
        name: 'Ironing',
        items: [
            {
                id: 'ir-shirt',
                name: 'Shirt / T-shirt',
                description: 'Steam pressed for a crisp finish',
                price: rupees(15),
                unit: 'piece',
                iconKey: 'shirt',
            },
            {
                id: 'ir-trousers',
                name: 'Trousers / Jeans',
                description: 'Steam pressed with a sharp crease',
                price: rupees(20),
                unit: 'piece',
                iconKey: 'box',
            },
        ],
    },
    {
        id: 'special',
        name: 'Special Care',
        items: [
            {
                id: 'sp-stain',
                name: 'Stain Removal',
                description: 'Targeted treatment for stubborn stains',
                price: rupees(99),
                unit: 'piece',
                iconKey: 'sparkles',
            },
            {
                id: 'sp-shoe',
                name: 'Shoe Cleaning',
                description: 'Deep clean and condition for leather or canvas',
                price: rupees(249),
                unit: 'piece',
                iconKey: 'shoe',
            },
        ],
    },
];

export const findMenuItem = (id: string) =>
    PARTNER_MENU.flatMap((category) => category.items).find((item) => item.id === id);

/** The catalogue repeats garment names across services, so lines need the service too. */
export const serviceNameFor = (itemId: string) =>
    PARTNER_MENU.find((category) => category.items.some((item) => item.id === itemId))?.name ?? '';
