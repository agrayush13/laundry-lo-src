import { describe, expect, it, vi } from 'vitest';
import { createAnalyticsReporter } from '../src/analytics.js';
import type { Config } from '../src/config.js';
import type { Order } from '../src/models.js';

const config: Pick<Config, 'umamiHostUrl' | 'umamiWebsiteId' | 'publicAppHostname'> = {
    umamiHostUrl: 'https://analytics.example.com',
    umamiWebsiteId: 'website-id',
    publicAppHostname: 'laundrylo.com',
};

const order = {
    id: 'ord_private_123',
    reference: 'LL-2026-9999',
    partner: { id: 'partner_private_123', name: 'Private Laundry' },
    deliveryAddress: {
        recipientName: 'Private Customer',
        phone: '+919999999999',
        pincode: '560103',
    },
    lines: [{ quantity: 2 }, { quantity: 1 }],
    totals: {
        membership: { amount: 9900, currency: 'INR' },
        total: { amount: 18054, currency: 'INR' },
    },
} as Order;

describe('order analytics', () => {
    it('reports an aggregate conversion without customer or order identifiers', async () => {
        const send = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
        const reporter = createAnalyticsReporter(config, send);

        reporter.trackOrderPlaced(order, 'Example Browser');

        await vi.waitFor(() => expect(send).toHaveBeenCalledOnce());
        const [url, init] = send.mock.calls[0]!;
        expect(url).toBe('https://analytics.example.com/api/send');
        expect(init.headers).toMatchObject({ 'User-Agent': 'Example Browser' });
        const body = JSON.parse(init.body as string) as Record<string, unknown>;
        expect(body).toEqual({
            type: 'event',
            payload: {
                website: 'website-id',
                hostname: 'laundrylo.com',
                url: '/checkout',
                title: 'Checkout',
                name: 'order_placed_server',
                data: {
                    source: 'database',
                    currency: 'INR',
                    revenue: 180.54,
                    item_count: 3,
                    has_plus: true,
                },
            },
        });
        const serialized = JSON.stringify(body);
        for (const privateValue of [
            order.id,
            order.reference,
            order.partner.id,
            order.partner.name,
            order.deliveryAddress.recipientName,
            order.deliveryAddress.phone,
            order.deliveryAddress.pincode,
        ]) {
            expect(serialized).not.toContain(privateValue);
        }
    });

    it('does nothing when Umami is not configured', () => {
        const send = vi.fn();
        const reporter = createAnalyticsReporter(
            { ...config, umamiHostUrl: ' ', umamiWebsiteId: ' ' },
            send
        );

        reporter.trackOrderPlaced(order);

        expect(send).not.toHaveBeenCalled();
    });
});
