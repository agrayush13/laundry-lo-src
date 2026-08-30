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
            'partner laundries are involved. Partner, catalogue and slot information ' +
            'comes from a seeded demo API.',
        'A pin code is sent to that demo API to filter nearby laundries. Account and ' +
            'address details remain in your browser while the real order API is not connected.',
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
