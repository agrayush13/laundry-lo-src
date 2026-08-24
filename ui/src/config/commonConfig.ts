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

export const ERROR_COPY = {
    title: 'Something went wrong',
    body: "That page ran into a problem. Trying again usually sorts it - if not, head back and we'll pick things up from there.",
    retry: 'Try again',
    home: 'Back to home',
    reload: 'Reload the page',
} as const;
