import {
    ANALYTICS_CONFIG,
    type AnalyticsConfig,
    type AnalyticsEventName,
} from '../config/analyticsConfig';

export type AnalyticsValue = string | number | boolean;
export type AnalyticsData = Record<string, AnalyticsValue>;

interface UmamiPayload {
    [key: string]: unknown;
}

interface UmamiTracker {
    track: {
        (): unknown;
        (eventName: string, data?: AnalyticsData): unknown;
        (payload: (properties: UmamiPayload) => UmamiPayload): unknown;
    };
}

interface AnalyticsWindow extends Window {
    umami?: UmamiTracker;
    laundryloAnalyticsBeforeSend?: (
        type: string,
        payload: UmamiPayload
    ) => UmamiPayload | undefined;
}

type QueuedEvent =
    | { type: 'pageview'; url: string; title: string }
    | { type: 'event'; name: AnalyticsEventName; data: AnalyticsData };

const SCRIPT_ID = 'laundrylo-analytics';
const MAX_QUEUED_EVENTS = 100;
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
const SAFE_UTM_VALUE = /^[A-Za-z0-9._~+-]{1,80}$/;

const routePatterns: Array<[RegExp, string]> = [
    [/^\/laundries\/[^/]+\/?$/, '/laundries/:partnerId'],
    [/^\/bookings\/[^/]+\/?$/, '/bookings/:orderId'],
    [/^\/partner\/orders\/[^/]+\/?$/, '/partner/orders/:orderId'],
    [/^\/profile\/addresses\/[^/]+\/edit\/?$/, '/profile/addresses/:addressId/edit'],
];

const validHostUrl = (value: string) => {
    try {
        const url = new URL(value);
        return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
        return false;
    }
};

/** Removes record ids and keeps only conventional, low-risk campaign tags. */
export const safeAnalyticsUrl = (pathname: string, search = '') => {
    const path = routePatterns.find(([pattern]) => pattern.test(pathname))?.[1] ?? pathname;
    const source = new URLSearchParams(search);
    const safe = new URLSearchParams();

    for (const key of UTM_KEYS) {
        const value = source.get(key)?.trim();
        if (value && SAFE_UTM_VALUE.test(value)) safe.set(key, value);
    }

    const query = safe.toString();
    return query ? `${path}?${query}` : path;
};

export interface AnalyticsClient {
    initialize: () => void;
    trackPageView: (pathname: string, search?: string) => void;
    trackEvent: (name: AnalyticsEventName, data?: AnalyticsData) => void;
}

export const createAnalyticsClient = (
    config: AnalyticsConfig,
    analyticsWindow: AnalyticsWindow = window,
    analyticsDocument: Document = document
): AnalyticsClient => {
    const enabled = Boolean(config.websiteId && validHostUrl(config.hostUrl));
    const queue: QueuedEvent[] = [];

    const send = (event: QueuedEvent) => {
        const tracker = analyticsWindow.umami;
        if (!tracker) return false;

        try {
            if (event.type === 'event') {
                tracker.track(event.name, event.data);
            } else {
                tracker.track((properties) => ({
                    ...properties,
                    url: event.url,
                    title: event.title,
                }));
            }
            return true;
        } catch {
            // Analytics is optional and must never interrupt a product action.
            return false;
        }
    };

    const enqueue = (event: QueuedEvent) => {
        if (!enabled || send(event)) return;
        if (queue.length === MAX_QUEUED_EVENTS) queue.shift();
        queue.push(event);
    };

    const flush = () => {
        while (queue.length > 0) {
            const next = queue[0]!;
            if (!send(next)) return;
            queue.shift();
        }
    };

    return {
        initialize: () => {
            if (!enabled) return;

            analyticsWindow.laundryloAnalyticsBeforeSend = (_type, payload) => {
                if (typeof payload['url'] !== 'string') return payload;
                try {
                    const url = new URL(payload['url'], analyticsWindow.location.origin);
                    return { ...payload, url: safeAnalyticsUrl(url.pathname, url.search) };
                } catch {
                    return undefined;
                }
            };

            const existing = analyticsDocument.getElementById(
                SCRIPT_ID
            ) as HTMLScriptElement | null;
            if (existing) {
                flush();
                return;
            }

            const base = config.hostUrl.endsWith('/') ? config.hostUrl : `${config.hostUrl}/`;
            const script = analyticsDocument.createElement('script');
            script.id = SCRIPT_ID;
            script.defer = true;
            script.src = new URL('script.js', base).toString();
            script.dataset.websiteId = config.websiteId;
            script.dataset.hostUrl = config.hostUrl.replace(/\/$/, '');
            script.dataset.autoPageview = 'false';
            script.dataset.beforeSend = 'laundryloAnalyticsBeforeSend';
            script.dataset.doNotTrack = 'true';
            script.dataset.performance = 'true';
            if (config.domains.length > 0) script.dataset.domains = config.domains.join(',');
            script.addEventListener('load', flush, { once: true });
            analyticsDocument.head.append(script);
        },
        trackPageView: (pathname, search = '') =>
            enqueue({
                type: 'pageview',
                url: safeAnalyticsUrl(pathname, search),
                title: analyticsDocument.title,
            }),
        trackEvent: (name, data = {}) => enqueue({ type: 'event', name, data }),
    };
};

export const analytics = createAnalyticsClient(ANALYTICS_CONFIG);
