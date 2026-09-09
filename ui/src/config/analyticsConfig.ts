const valueOf = (value: string | undefined) => value?.trim() ?? '';

const hostUrl = valueOf(typeof __UMAMI_HOST_URL__ === 'undefined' ? '' : __UMAMI_HOST_URL__);
const websiteId = valueOf(typeof __UMAMI_WEBSITE_ID__ === 'undefined' ? '' : __UMAMI_WEBSITE_ID__);
const domains = valueOf(typeof __UMAMI_DOMAINS__ === 'undefined' ? '' : __UMAMI_DOMAINS__)
    .split(',')
    .map((domain) => domain.trim())
    .filter(Boolean);

export interface AnalyticsConfig {
    hostUrl: string;
    websiteId: string;
    domains: string[];
}

/**
 * All values are browser-safe identifiers. Leaving either required value blank
 * disables analytics, which keeps local development and test runs out of the
 * production dataset.
 */
export const ANALYTICS_CONFIG: AnalyticsConfig = { hostUrl, websiteId, domains };

export const ANALYTICS_EVENTS = {
    partnerSearch: 'partner_search',
    partnerResults: 'partner_results',
    laundryViewed: 'laundry_viewed',
    cartItemAdded: 'cart_item_added',
    cartViewed: 'cart_viewed',
    checkoutStarted: 'checkout_started',
    passwordSignIn: 'password_sign_in',
    passwordSignUp: 'password_sign_up',
    googleSignInStarted: 'google_sign_in_started',
    authCallbackCompleted: 'auth_callback_completed',
    orderPlaced: 'order_placed',
    orderTrackingViewed: 'order_tracking_viewed',
    orderCancelled: 'order_cancelled',
    orderRescheduled: 'order_rescheduled',
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];
