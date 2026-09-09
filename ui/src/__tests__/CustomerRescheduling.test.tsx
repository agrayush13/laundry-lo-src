import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Order } from '../data/orders';
import { ORDERS } from '../data/orders';
import { fixtureFetch } from '../__mocks__/apiFixtures';
import { authenticateTestUser, renderApp } from '../__mocks__/renderWithProviders';

const OLD_PICKUP = {
    date: '2026-09-10',
    startsAt: '2026-09-10T02:30:00.000Z',
    endsAt: '2026-09-10T04:30:00.000Z',
};
const OLD_DELIVERY = {
    date: '2026-09-12',
    startsAt: '2026-09-12T08:30:00.000Z',
    endsAt: '2026-09-12T10:30:00.000Z',
};
const NEW_PICKUP = {
    date: '2026-09-14',
    startsAt: '2026-09-14T02:30:00.000Z',
    endsAt: '2026-09-14T04:30:00.000Z',
};
const NEW_DELIVERY = {
    date: '2026-09-15',
    startsAt: '2026-09-15T08:30:00.000Z',
    endsAt: '2026-09-15T10:30:00.000Z',
};

const reschedulableOrder = (): Order => ({
    ...ORDERS[0]!,
    status: 'processing',
    canCancel: true,
    canReschedule: true,
    pickup: OLD_PICKUP,
    delivery: OLD_DELIVERY,
    events: [{ type: 'placed', occurredAt: '2026-09-09T06:00:00.000Z' }],
    reschedules: [],
});

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });

const installReschedulingApi = () => {
    let order = reschedulableOrder();
    const fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(String(input), 'http://localhost');
        const path = url.pathname.replace('/api/v1', '');
        const method = init?.method ?? 'GET';

        if (path === `/orders/${order.id}` && method === 'GET') return Promise.resolve(json(order));

        if (path === `/partners/${order.partner.id}/slots` && method === 'GET') {
            return Promise.resolve(
                json({
                    days: [
                        {
                            date: NEW_PICKUP.date,
                            slots: [{ id: 'slt_new_pickup', ...NEW_PICKUP, available: true }],
                        },
                        {
                            date: NEW_DELIVERY.date,
                            slots: [{ id: 'slt_new_delivery', ...NEW_DELIVERY, available: true }],
                        },
                    ],
                })
            );
        }

        if (path === `/orders/${order.id}/rescheduling` && method === 'POST') {
            const body = JSON.parse(String(init?.body)) as {
                pickupSlotId: string;
                deliverySlotId: string;
            };
            if (
                body.pickupSlotId !== 'slt_new_pickup' ||
                body.deliverySlotId !== 'slt_new_delivery'
            ) {
                return Promise.resolve(
                    json(
                        {
                            error: {
                                code: 'SLOT_UNAVAILABLE',
                                message: 'One of those time slots is no longer available.',
                                requestId: 'rescheduling-test',
                            },
                        },
                        409
                    )
                );
            }
            const occurredAt = '2026-09-09T06:30:00.000Z';
            order = {
                ...order,
                pickup: NEW_PICKUP,
                delivery: NEW_DELIVERY,
                reschedules: [
                    {
                        occurredAt,
                        previous: { pickup: OLD_PICKUP, delivery: OLD_DELIVERY },
                        updated: { pickup: NEW_PICKUP, delivery: NEW_DELIVERY },
                    },
                ],
            };
            return Promise.resolve(json({ orderId: order.id, rescheduledAt: occurredAt }));
        }

        return Promise.resolve(fixtureFetch(input));
    });
    vi.stubGlobal('fetch', fetch);
    return { fetch, orderId: order.id };
};

describe('customer order rescheduling', () => {
    it('selects a new pickup and delivery pair and refreshes the tracked schedule', async () => {
        const user = userEvent.setup();
        authenticateTestUser();
        const { fetch, orderId } = installReschedulingApi();
        renderApp(`/bookings/${orderId}`);

        await user.click(await screen.findByRole('button', { name: 'Change schedule' }));
        const pickupPicker = await screen.findByRole('region', { name: 'Choose a new pickup' });
        const deliveryPicker = screen.getByRole('region', { name: 'Choose a new delivery' });

        await user.click(within(pickupPicker).getAllByRole('button')[0]!);
        await user.click(within(pickupPicker).getAllByRole('button')[2]!);
        await user.click(within(deliveryPicker).getAllByRole('button')[1]!);
        await user.click(within(deliveryPicker).getAllByRole('button')[2]!);
        await user.click(screen.getByRole('button', { name: 'Save new schedule' }));

        await waitFor(() => expect(screen.queryByText(/Schedule last changed/)).not.toBeNull());
        expect(screen.queryByRole('button', { name: 'Save new schedule' })).toBeNull();
        const mutation = fetch.mock.calls.find(
            ([input, init]) =>
                String(input).endsWith(`/orders/${orderId}/rescheduling`) && init?.method === 'POST'
        );
        expect(mutation?.[1]?.body).toBe(
            JSON.stringify({
                pickupSlotId: 'slt_new_pickup',
                deliverySlotId: 'slt_new_delivery',
            })
        );
    });

    it('requires both new appointments before submitting', async () => {
        const user = userEvent.setup();
        authenticateTestUser();
        const { fetch, orderId } = installReschedulingApi();
        renderApp(`/bookings/${orderId}`);

        await user.click(await screen.findByRole('button', { name: 'Change schedule' }));
        await screen.findByRole('region', { name: 'Choose a new pickup' });
        await user.click(screen.getByRole('button', { name: 'Save new schedule' }));

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'Choose both a pickup and delivery time.'
        );
        expect(
            fetch.mock.calls.some(
                ([input, init]) =>
                    String(input).endsWith(`/orders/${orderId}/rescheduling`) &&
                    init?.method === 'POST'
            )
        ).toBe(false);
    });
});
