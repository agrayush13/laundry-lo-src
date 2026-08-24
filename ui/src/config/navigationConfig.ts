import { IconName } from '../common-ui/icons/registry';

export interface NavLink {
    label: string;
    href: string;
}

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
    signIn: '/signin',
    signUp: '/signup',
    forgotPassword: '/forgot-password',
    laundries: '/laundries',
    cart: '/cart',
    profile: '/profile',
    addAddress: '/profile/addresses/new',
    bookings: '/bookings',
    plus: '/plus',
    signUpCta: '/signup',
    laundry: (partnerId: string) => `/laundries/${partnerId}`,
    checkout: '/checkout',
    orderConfirmed: '/order-confirmed',
    order: (orderId: string) => `/bookings/${orderId}`,
    laundriesForPin: (pinCode: string) => `/laundries?pin=${pinCode}`,
} as const;
