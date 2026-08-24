export const BRAND = {
    name: 'laundrylo',
    blurb:
        'laundrylo brings your neighbourhood laundries online. Compare prices and ' +
        'ratings, pick a pickup slot that suits you, and get fresh, neatly folded ' +
        'clothes back at your door within 24 hours.',
    blurbSecondary:
        'Free pickup and delivery on every order, and you see the full price ' + 'before you book.',
    supportPhone: '+911800000000',
    copyrightFrom: 2026,
} as const;

export const ICON_SIZE = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 26,
    hero: 30,
} as const;

/** Matches $icon-stroke-width in the design tokens. */
export const ICON_STROKE_WIDTH = 1.8;

export const CURRENCY = {
    symbol: '₹',
    locale: 'en-IN',
} as const;
