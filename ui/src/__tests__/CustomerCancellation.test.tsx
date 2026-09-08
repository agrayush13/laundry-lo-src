import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Order } from '../data/orders';
import { ORDERS } from '../data/orders';
import { fixtureFetch } from '../__mocks__/apiFixtures';
import { authenticateTestUser, renderApp } from '../__mocks__/renderWithProviders';

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });

const cancellableOrder = (): Order => ({
    ...ORDERS[0]!,
    status: 'processing',
    canCancel: true,
    events: [
        { type: 'placed', occurredAt: '2026-09-07T06:00:00.000Z' },
        { type: 'confirmed', occurredAt: '2026-09-07T06:15:00.000Z' },
    ],
});

const installCancellationApi = ({ fails = false } = {}) => {
    let order = cancellableOrder();
    const fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const path = new URL(String(input), 'http://localhost').pathname.replace('/api/v1', '');
        const method = init?.method ?? 'GET';

        if (path === `/orders/${order.id}` && method === 'GET') return Promise.resolve(json(order));

        if (path === `/orders/${order.id}/cancellation` && method === 'POST') {
            if (fails) {
                return Promise.resolve(
                    json(
                        {
                            error: {
                                code: 'INTERNAL_ERROR',
                                message: 'Cancellation could not be completed.',
                                requestId: 'customer-cancellation-test',
                            },
                        },
                        500
                    )
                );
            }
            const event = { type: 'cancelled' as const, occurredAt: '2026-09-07T06:30:00.000Z' };
            order = {
                ...order,
                status: 'cancelled',
                canCancel: false,
                events: [...order.events, event],
            };
            return Promise.resolve(json({ orderId: order.id, status: order.status, event }));
        }

        return Promise.resolve(fixtureFetch(input));
    });
    vi.stubGlobal('fetch', fetch);
    return { fetch, orderId: order.id };
};

describe('customer order cancellation', () => {
    it('confirms cancellation before updating tracking and removes the action afterward', async () => {
        const user = userEvent.setup();
        authenticateTestUser();
        const { fetch, orderId } = installCancellationApi();
        renderApp(`/bookings/${orderId}`);

        await user.click(await screen.findByRole('button', { name: 'Cancel order' }));
        const confirmation = screen.getByRole('alertdialog');
        expect(
            within(confirmation).getByRole('heading', { name: 'Cancel this order?' })
        ).toBeInTheDocument();
        expect(within(confirmation).getByRole('button', { name: 'Keep order' })).toHaveFocus();
        expect(fetch.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false);

        await user.click(within(confirmation).getByRole('button', { name: 'Yes, cancel order' }));

        expect(await screen.findByText('Order Cancelled')).toBeInTheDocument();
        expect(screen.getByText('Cancelled')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Cancel order' })).toBeNull();
        const mutation = fetch.mock.calls.find(([, init]) => init?.method === 'POST');
        expect(mutation?.[0]).toBe(`/api/v1/orders/${orderId}/cancellation`);
        expect(mutation?.[1]?.body).toBeUndefined();
    });

    it('keeps the confirmation available and reports a server failure', async () => {
        const user = userEvent.setup();
        authenticateTestUser();
        const { orderId } = installCancellationApi({ fails: true });
        renderApp(`/bookings/${orderId}`);

        await user.click(await screen.findByRole('button', { name: 'Cancel order' }));
        await user.click(screen.getByRole('button', { name: 'Yes, cancel order' }));

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'Cancellation could not be completed.'
        );
        await waitFor(() =>
            expect(screen.getByRole('button', { name: 'Yes, cancel order' })).not.toBeDisabled()
        );
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('does not offer self-service cancellation when the server disallows it', async () => {
        authenticateTestUser();
        renderApp(`/bookings/${ORDERS[0]!.id}`);

        expect(
            await screen.findByRole('heading', { name: ORDERS[0]!.reference })
        ).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Cancel order' })).toBeNull();
        expect(screen.getByRole('link', { name: 'Call Support' })).toBeInTheDocument();
    });
});
