import type { ServiceId } from '../data/services';

export const PARTNER_SERVICE_LABELS: Record<ServiceId, string> = {
    'wash-fold': 'Wash & Fold',
    'wash-iron': 'Wash & Iron',
    'dry-cleaning': 'Dry Cleaning',
    'premium-care': 'Premium Care',
};

export const PARTNER_SERVICE_IDS = Object.keys(PARTNER_SERVICE_LABELS) as ServiceId[];

export const partnerServiceLabel = (service: ServiceId) => PARTNER_SERVICE_LABELS[service];

export const PARTNER_CATALOG_COPY = {
    eyebrow: 'Laundry operations',
    title: 'Catalogue and pricing',
    intro: 'Build and maintain customer-facing services, items, prices and availability.',
    portalNavigation: 'Partner portal',
    settingsLink: 'Laundry settings',
    ordersLink: 'Order queue',
    locationLabel: 'Laundry location',
    categoryName: 'Customer-facing service name',
    createCategoryTitle: 'Add a service',
    createCategoryBody: 'Choose a platform service, then name it for your customers.',
    serviceType: 'Service type',
    createCategory: 'Add service',
    creating: 'Adding…',
    allServicesAdded: 'All available service types are already in this catalogue.',
    saveCategory: 'Save service name',
    saving: 'Saving…',
    itemName: 'Item name',
    description: 'Description (optional)',
    price: 'Price (₹ per piece)',
    available: 'Available to customers',
    active: 'Available',
    inactive: 'Hidden',
    itemSingular: 'item',
    itemPlural: 'items',
    saveItem: 'Save item',
    createItem: 'Add an item',
    createItemTitle: 'New catalogue item',
    createItemBody: 'Add a per-piece INR price. You can hide the item before publishing it.',
    saved: 'Saved.',
    loading: 'Loading laundry catalogue',
    emptyTitle: 'No catalogue yet',
    emptyBody: 'Add the first service above, then create its customer-facing items.',
    categoryNameError: 'Enter a service name.',
    itemNameError: 'Enter an item name.',
    priceError: 'Enter a price from ₹0 to ₹1,000,000 with no more than two decimal places.',
    saveFallback: 'The catalogue change could not be saved. Try again.',
    preservationNote:
        'Items are hidden rather than deleted so existing carts and completed-order records remain intact.',
} as const;
