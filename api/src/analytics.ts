import type { Config } from './config.js';
import type { Order } from './models.js';

export interface AnalyticsReporter {
    trackOrderPlaced: (order: Order, userAgent?: string) => void;
}

export const NOOP_ANALYTICS: AnalyticsReporter = { trackOrderPlaced: () => {} };

type AnalyticsFetch = typeof fetch;

const validHttpUrl = (value: string | undefined): value is string => {
    if (!value) return false;
    try {
        return ['http:', 'https:'].includes(new URL(value).protocol);
    } catch {
        return false;
    }
};

/**
 * Reports only the successful, non-replayed transaction. It deliberately sends
 * no account, address, order, pincode or partner identifier. Delivery is
 * fire-and-forget and internally guarded so analytics can never fail checkout.
 */
export const createAnalyticsReporter = (
    config: Pick<Config, 'umamiHostUrl' | 'umamiWebsiteId' | 'publicAppHostname'>,
    send: AnalyticsFetch = fetch
): AnalyticsReporter => {
    const hostUrl = config.umamiHostUrl?.trim();
    const websiteId = config.umamiWebsiteId?.trim();
    if (!validHttpUrl(hostUrl) || !websiteId) {
        return NOOP_ANALYTICS;
    }

    const endpoint = new URL(
        'api/send',
        hostUrl.endsWith('/') ? hostUrl : `${hostUrl}/`
    ).toString();
    const hostname = config.publicAppHostname.trim() || 'localhost';

    return {
        trackOrderPlaced: (order, userAgent) => {
            const itemCount = order.lines.reduce((total, line) => total + line.quantity, 0);
            void Promise.resolve()
                .then(() =>
                    send(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'User-Agent': userAgent?.trim() || 'laundrylo-api/1.1.0',
                        },
                        body: JSON.stringify({
                            type: 'event',
                            payload: {
                                website: websiteId,
                                hostname,
                                url: '/checkout',
                                title: 'Checkout',
                                name: 'order_placed_server',
                                data: {
                                    source: 'database',
                                    currency: order.totals.total.currency,
                                    revenue: order.totals.total.amount / 100,
                                    item_count: itemCount,
                                    has_plus: order.totals.membership.amount > 0,
                                },
                            },
                        }),
                        signal: AbortSignal.timeout(2_000),
                    })
                )
                .then((response) => {
                    if (!response.ok) {
                        console.warn(`Analytics rejected an order event with ${response.status}.`);
                    }
                })
                .catch(() => {
                    console.warn('Analytics could not receive an order event.');
                });
        },
    };
};
