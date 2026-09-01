import { IconName } from '../common-ui/icons/registry';

export interface NavLink {
    label: string;
    href: string;
}

/**
 * The journey is deliberately not here. It is reachable by typing the URL and by
 * nothing else: it is a showpiece rather than a product surface, and a nav item
 * for it sends everybody who came to price a wash into the long way round
 * instead. `ROUTES.journey` still resolves, and the route still suppresses the
 * app chrome; it is only unadvertised.
 */
export const PRIMARY_NAV: NavLink[] = [
    { label: 'Services', href: '/#services' },
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Pricing', href: '/#pricing' },
];

export const HEADER_ACTIONS = {
    guest: {
        signIn: { label: 'Sign in', href: '/signin', icon: 'user' as IconName },
        cta: { label: 'Book Now', href: '/laundries' },
    },
    cart: { label: 'Cart', href: '/cart', icon: 'cart' as IconName },
    authenticated: {
        bookings: { label: 'My Bookings', href: '/bookings', icon: 'receipt' as IconName },
        profile: { href: '/profile' },
        signOut: { label: 'Sign out', icon: 'log-out' as IconName },
    },
} as const;

export interface ExternalLink {
    label: string;
    href: string;
    icon?: IconName;
}

/** Rendered in the footer bar; these leave the app, so they carry full URLs. */
export const EXTERNAL_LINKS: ExternalLink[] = [
    {
        label: 'GitHub',
        href: 'https://github.com/agrayush13/laundry-lo-src',
        icon: 'github',
    },
];

export const ROUTES = {
    home: '/',
    journey: '/journey',
    terms: '/terms',
    signIn: '/signin',
    signUp: '/signup',
    forgotPassword: '/forgot-password',
    authCallback: '/auth/callback',
    updatePassword: '/update-password',
    laundries: '/laundries',
    cart: '/cart',
    profile: '/profile',
    addAddress: '/profile/addresses/new',
    editAddress: (addressId: string) => `/profile/addresses/${addressId}/edit`,
    bookings: '/bookings',
    plus: '/plus',
    signUpCta: '/signup',
    laundry: (partnerId: string) => `/laundries/${partnerId}`,
    checkout: '/checkout',
    orderConfirmed: '/order-confirmed',
    order: (orderId: string) => `/bookings/${orderId}`,
    laundriesForPin: (pinCode: string) => `/laundries?pin=${pinCode}`,
    laundriesForService: (service: string, pinCode: string) =>
        `/laundries?pin=${pinCode}&service=${service}`,
} as const;

/**
 * The footer of the journey. Every entry resolves to something real: no socials,
 * no careers page, nothing that would need inventing.
 */
export const CYCLE_FOOTER_LINKS: NavLink[] = [
    { label: 'home', href: ROUTES.home },
    { label: 'services', href: ROUTES.laundries },
    { label: 'plus', href: ROUTES.plus },
    { label: 'terms', href: ROUTES.terms },
    { label: 'github', href: EXTERNAL_LINKS[0].href },
];

export const APP_NAME = 'laundrylo';

/**
 * One title per route. A single-page app changes the document without changing
 * the document title, so without this every route claims to be the homepage:
 * the tab, the bookmark, the history entry and the screen reader's announcement
 * of the new page are all the same string on all fifteen routes.
 *
 * Matched in order, so a dynamic route is listed after the literal one it would
 * otherwise swallow. Titles are per pattern rather than per record, because the
 * partner's name is not known until its request lands and a title that arrives
 * late announces twice.
 */
const PAGE_TITLES: { match: RegExp; title: string }[] = [
    { match: /^\/$/, title: 'Laundry pickup and delivery' },
    { match: /^\/journey\/?$/, title: 'The cycle' },
    { match: /^\/terms\/?$/, title: 'Terms' },
    { match: /^\/signin\/?$/, title: 'Sign in' },
    { match: /^\/signup\/?$/, title: 'Create an account' },
    { match: /^\/forgot-password\/?$/, title: 'Reset your password' },
    { match: /^\/auth\/callback\/?$/, title: 'Completing sign in' },
    { match: /^\/update-password\/?$/, title: 'Choose a new password' },
    { match: /^\/plus\/?$/, title: 'laundrylo Plus' },
    { match: /^\/laundries\/?$/, title: 'Laundries near you' },
    { match: /^\/laundries\/[^/]+\/?$/, title: 'Laundry' },
    { match: /^\/cart\/?$/, title: 'Your cart' },
    { match: /^\/checkout\/?$/, title: 'Checkout' },
    { match: /^\/order-confirmed\/?$/, title: 'Booking confirmed' },
    { match: /^\/profile\/addresses\/new\/?$/, title: 'Add an address' },
    { match: /^\/profile\/addresses\/[^/]+\/edit\/?$/, title: 'Edit address' },
    { match: /^\/profile\/?$/, title: 'Your profile' },
    { match: /^\/bookings\/?$/, title: 'My bookings' },
    { match: /^\/bookings\/[^/]+\/?$/, title: 'Order' },
];

/** The page's own name, without the app name appended. */
export const pageNameFor = (pathname: string) =>
    PAGE_TITLES.find(({ match }) => match.test(pathname))?.title ?? 'Page not found';

export const documentTitleFor = (pathname: string) =>
    pathname === ROUTES.home
        ? `${APP_NAME} - ${pageNameFor(pathname)}`
        : `${pageNameFor(pathname)} - ${APP_NAME}`;
