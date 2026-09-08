export const PARTNER_SERVICE_LABELS: Record<string, string> = {
    'wash-fold': 'Wash & Fold',
    'wash-iron': 'Wash & Iron',
    'dry-cleaning': 'Dry Cleaning',
    'premium-care': 'Premium Care',
};

export const partnerServiceLabel = (service: string) => PARTNER_SERVICE_LABELS[service] ?? service;

export const PARTNER_CATALOG_COPY = {
    eyebrow: 'Laundry operations',
    title: 'Catalogue and pricing',
    intro: 'Keep customer-facing service names, items, prices and availability accurate.',
    portalNavigation: 'Partner portal',
    settingsLink: 'Laundry settings',
    ordersLink: 'Order queue',
    locationLabel: 'Laundry location',
    categoryName: 'Customer-facing service name',
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
    saved: 'Saved.',
    loading: 'Loading laundry catalogue',
    emptyTitle: 'No catalogue yet',
    emptyBody: 'New services are created during laundry onboarding. No existing items were found.',
    categoryNameError: 'Enter a service name.',
    itemNameError: 'Enter an item name.',
    priceError: 'Enter a price from ₹0 to ₹1,000,000 with no more than two decimal places.',
    saveFallback: 'The catalogue change could not be saved. Try again.',
    preservationNote:
        'Items are hidden rather than deleted so existing carts and completed-order records remain intact.',
} as const;
