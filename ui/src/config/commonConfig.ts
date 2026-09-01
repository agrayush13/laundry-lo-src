export const STORAGE_KEYS = {
    theme: 'laundrylo.theme',
    cart: 'laundrylo.cart',
    profile: 'laundrylo.profile',
} as const;

export const COMMON_COPY = {
    comingSoon: 'Coming soon',
} as const;

export const UPDATE_COPY = {
    message: 'A new version of laundrylo is ready.',
    action: 'Refresh',
    dismiss: 'Dismiss update notice',
} as const;

export const TERMS_COPY = {
    back: 'Back to home',
    title: 'Terms',
    body: [
        'laundrylo is a deployed full-stack product demonstration built by Ayush Agrawal. ' +
            'It is not yet an operational laundry or delivery service.',
        'A booking creates an application order and reserves demo availability, but no ' +
            'physical pickup, laundry service, payment or partner fulfilment takes place.',
        'Account, address and order details are stored through Supabase and PostgreSQL. ' +
            'Use demonstration details rather than sensitive personal information.',
    ],
} as const;

export const NOT_FOUND_COPY = {
    title: 'That page does not exist',
    body:
        'The link may be out of date, or the address may have a typo in it. ' +
        'Everything else is where you left it.',
    home: 'Back to home',
    laundries: 'Find a laundry',
} as const;

export const ERROR_COPY = {
    title: 'Something went wrong',
    body: "That page ran into a problem. Trying again usually sorts it - if not, head back and we'll pick things up from there.",
    retry: 'Try again',
    home: 'Back to home',
    reload: 'Reload the page',
} as const;
