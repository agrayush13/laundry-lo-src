import { describe, expect, it, vi } from 'vitest';
import { createAnalyticsClient, safeAnalyticsUrl } from '../services/analyticsServices';
import type { AnalyticsConfig } from '../config/analyticsConfig';

const config: AnalyticsConfig = {
    hostUrl: 'https://analytics.example.com',
    websiteId: 'website-id',
    domains: ['laundrylo.com', 'www.laundrylo.com'],
};

describe('analytics', () => {
    beforeEach(() => {
        document.getElementById('laundrylo-analytics')?.remove();
        delete (window as Window & { umami?: unknown }).umami;
    });

    it('removes record ids and private search values while preserving safe campaign tags', () => {
        expect(
            safeAnalyticsUrl(
                '/bookings/order-secret',
                '?pin=560103&utm_source=github&utm_campaign=readme-launch&email=me@example.com'
            )
        ).toBe('/bookings/:orderId?utm_source=github&utm_campaign=readme-launch');
        expect(safeAnalyticsUrl('/profile/addresses/address-secret/edit')).toBe(
            '/profile/addresses/:addressId/edit'
        );
        expect(safeAnalyticsUrl('/laundries/partner-1001')).toBe('/laundries/:partnerId');
    });

    it('loads Umami once and flushes sanitized page views and product events', () => {
        const track = vi.fn();
        const analyticsWindow = window as Window & { umami?: { track: typeof track } };
        const analyticsDocument = document.implementation.createHTMLDocument('Order - laundrylo');
        analyticsDocument.title = 'Order - laundrylo';
        let appendedScript: HTMLScriptElement | null = null;
        const append = vi.spyOn(analyticsDocument.head, 'append').mockImplementation((node) => {
            appendedScript = node as HTMLScriptElement;
        });
        vi.spyOn(analyticsDocument, 'getElementById').mockImplementation(() => appendedScript);
        const client = createAnalyticsClient(config, analyticsWindow, analyticsDocument);

        client.trackPageView('/bookings/private-id', '?pin=560103&utm_source=github');
        client.trackEvent('checkout_started', { item_count: 3, has_plus: false });
        client.initialize();
        client.initialize();

        const script = appendedScript as HTMLScriptElement | null;
        expect(script).toBeTruthy();
        expect(append).toHaveBeenCalledOnce();
        expect(script?.src).toBe('https://analytics.example.com/script.js');
        expect(script?.dataset).toMatchObject({
            websiteId: 'website-id',
            hostUrl: 'https://analytics.example.com',
            autoPageview: 'false',
            beforeSend: 'laundryloAnalyticsBeforeSend',
            doNotTrack: 'true',
            performance: 'true',
            domains: 'laundrylo.com,www.laundrylo.com',
        });
        expect(
            (
                analyticsWindow as Window & {
                    laundryloAnalyticsBeforeSend: (
                        type: string,
                        payload: Record<string, unknown>
                    ) => Record<string, unknown>;
                }
            ).laundryloAnalyticsBeforeSend('event', {
                url: 'https://laundrylo.com/laundries/1001?pin=560103&utm_source=github',
            })
        ).toEqual({ url: '/laundries/:partnerId?utm_source=github' });

        analyticsWindow.umami = { track };
        script?.dispatchEvent(new Event('load'));

        expect(track).toHaveBeenCalledTimes(2);
        const pageView = track.mock.calls[0]![0] as (
            properties: Record<string, unknown>
        ) => Record<string, unknown>;
        expect(pageView({ referrer: 'https://github.com/' })).toEqual({
            referrer: 'https://github.com/',
            url: '/bookings/:orderId?utm_source=github',
            title: 'Order - laundrylo',
        });
        expect(track.mock.calls[1]).toEqual([
            'checkout_started',
            { item_count: 3, has_plus: false },
        ]);
    });

    it('stays dormant when no analytics instance is configured', () => {
        const client = createAnalyticsClient(
            { hostUrl: '', websiteId: '', domains: [] },
            window,
            document
        );

        client.initialize();
        client.trackPageView('/');

        expect(document.getElementById('laundrylo-analytics')).toBeNull();
    });
});
