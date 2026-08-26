export const STORAGE_KEYS = {
    theme: 'laundrylo.theme',
    user: 'laundrylo.user',
    cart: 'laundrylo.cart',
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
        'laundrylo is a demo project built by Ayush Agrawal to show how a laundry ' +
            'marketplace could work. It is not a real service.',
        'No orders are placed, no pickups happen, no payments are taken and no ' +
            'partner laundries are involved. Everything on the site runs on seeded ' +
            'demo data in your own browser.',
        'Anything you type into the site, including a pin code or an address, stays ' +
            'in your browser and is never sent anywhere.',
    ],
} as const;

export const ERROR_COPY = {
    title: 'Something went wrong',
    body: "That page ran into a problem. Trying again usually sorts it - if not, head back and we'll pick things up from there.",
    retry: 'Try again',
    home: 'Back to home',
    reload: 'Reload the page',
} as const;
