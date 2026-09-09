import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PartnerOrderDetail, PartnerOrderSummary } from '../models/partnerOrderModels';
import type { OrderStatus } from '../data/orders';
import { authenticateTestUser, renderApp } from '../__mocks__/renderWithProviders';

const money = (amount: number) => ({ amount, currency: 'INR' as const });
const pickup = {
    date: '2026-09-08',
    startsAt: '2026-09-08T02:30:00.000Z',
    endsAt: '2026-09-08T04:30:00.000Z',
};
const delivery = {
    date: '2026-09-10',
    startsAt: '2026-09-10T08:30:00.000Z',
    endsAt: '2026-09-10T10:30:00.000Z',
};

const summary = (
    id: string,
    reference: string,
    recipient: string,
    status: OrderStatus
): PartnerOrderSummary => ({
    id,
    reference,
    status,
    placedAt: '2026-09-07T06:00:00.000Z',
    partner: { id: '1001', name: 'SparkleWash Express' },
    recipient: { name: recipient, pincode: '560103' },
    itemCount: 3,
    total: money(8260),
    pickup,
    delivery,
    latestEvent: {
        type: status === 'delivered' ? 'delivered' : 'placed',
        occurredAt: '2026-09-07T06:00:00.000Z',
    },
});

const FIRST_ORDER = summary('ord_partner_1', 'LL-2026-101', 'Asha Rao', 'processing');
const SECOND_ORDER = summary('ord_partner_2', 'LL-2026-100', 'Ravi Shah', 'delivered');

const initialDetail = (): PartnerOrderDetail => ({
    id: FIRST_ORDER.id,
    reference: FIRST_ORDER.reference,
    status: 'processing',
    placedAt: FIRST_ORDER.placedAt,
    partner: FIRST_ORDER.partner,
    lines: [
        {
            itemId: 'itm_1001_wf-shirt',
            name: 'Shirt / T-shirt',
            quantity: 3,
            unit: 'piece',
            amount: money(6000),
        },
    ],
    totals: {
        subtotal: money(7000),
        delivery: money(0),
        tax: money(1260),
        total: money(8260),
    },
    deliveryAddress: {
        label: 'Home',
        recipientName: 'Asha Rao',
        phone: '+91 90000 00101',
        building: '42',
        street: 'Sector 5, HSR Layout',
        landmark: 'Near the park',
        pincode: '560103',
    },
    pickup,
    delivery,
    events: [{ type: 'placed', occurredAt: FIRST_ORDER.placedAt }],
    reschedules: [],
});

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });

const apiError = (code: string, message: string, status: number) =>
    json({ error: { code, message, requestId: 'partner-portal-test' } }, status);

const installPartnerApi = ({ failPagination = false, failTransition = false } = {}) => {
    let detail = initialDetail();

    const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(String(input), 'http://localhost');
        const path = url.pathname.replace('/api/v1', '');
        const method = init?.method ?? 'GET';

        if (path === '/partner/orders' && method === 'GET') {
            const status = url.searchParams.get('status');
            const cursor = url.searchParams.get('cursor');

            if (status === 'delivered') return json({ data: [SECOND_ORDER], nextCursor: null });
            if (status === 'cancelled') return json({ data: [], nextCursor: null });
            if (cursor === 'next-page') {
                return failPagination
                    ? apiError('INTERNAL_ERROR', 'The next page could not be loaded.', 500)
                    : json({ data: [SECOND_ORDER], nextCursor: null });
            }
            return json({ data: [FIRST_ORDER], nextCursor: 'next-page' });
        }

        if (path === '/partner/orders/summary' && method === 'GET') {
            return json({
                activeOrders: 4,
                awaitingConfirmation: 2,
                pickupsToday: 3,
                deliveriesToday: 1,
                completedToday: 5,
                generatedAt: '2026-09-09T06:00:00.000Z',
            });
        }

        if (path === `/partner/orders/${FIRST_ORDER.id}` && method === 'GET') {
            return json(detail);
        }

        if (path === `/partner/orders/${FIRST_ORDER.id}/events` && method === 'POST') {
            if (failTransition) {
                return apiError(
                    'INVALID_ORDER_TRANSITION',
                    'That order cannot move to the requested stage.',
                    409
                );
            }
            const body = JSON.parse(String(init?.body)) as { type: string };
            if (body.type !== 'confirmed') {
                return apiError(
                    'INVALID_ORDER_TRANSITION',
                    'That order cannot move to the requested stage.',
                    409
                );
            }
            const event = { type: 'confirmed' as const, occurredAt: '2026-09-07T06:15:00.000Z' };
            detail = { ...detail, events: [...detail.events, event] };
            return json({ orderId: detail.id, status: detail.status, event }, 201);
        }

        return apiError('NOT_FOUND', 'No such endpoint.', 404);
    });

    vi.stubGlobal('fetch', fetch);
    return fetch;
};

describe('laundry-partner order portal', () => {
    it('returns an owner to the protected queue after sign-in', async () => {
        const user = userEvent.setup();
        installPartnerApi();
        renderApp('/partner/orders');

        await user.type(await screen.findByLabelText('Email'), 'owner@example.com');
        await user.type(screen.getByLabelText('Password'), 'password');
        await user.click(screen.getByRole('button', { name: /^sign in$/i }));

        expect(
            await screen.findByRole('heading', { name: 'Order queue', level: 1 })
        ).toBeInTheDocument();
        expect(await screen.findByText(`Order ${FIRST_ORDER.reference}`)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Manage catalogue' })).toHaveAttribute(
            'href',
            '/partner/catalogue'
        );
    });

    it('paginates the queue and asks the server for the selected status', async () => {
        const user = userEvent.setup();
        authenticateTestUser();
        const fetch = installPartnerApi();
        renderApp('/partner/orders');

        expect(await screen.findByText(FIRST_ORDER.recipient.name)).toBeInTheDocument();
        const summary = screen.getByRole('region', { name: 'Today at a glance' });
        expect(within(summary).getByText('Active orders').previousElementSibling).toHaveTextContent(
            '4'
        );
        expect(
            within(summary).getByText('Awaiting confirmation').previousElementSibling
        ).toHaveTextContent('2');
        expect(
            within(summary).getByText('Completed today').previousElementSibling
        ).toHaveTextContent('5');
        await user.click(screen.getByRole('button', { name: 'Load more orders' }));
        expect(await screen.findByText(SECOND_ORDER.recipient.name)).toBeInTheDocument();
        expect(screen.getByText('2 orders loaded')).toBeInTheDocument();

        await user.selectOptions(
            screen.getByRole('combobox', { name: 'Filter orders by status' }),
            'delivered'
        );

        await waitFor(() => expect(screen.queryByText(FIRST_ORDER.recipient.name)).toBeNull());
        expect(screen.getByText(SECOND_ORDER.recipient.name)).toBeInTheDocument();
        expect(
            fetch.mock.calls.some(([input]) =>
                String(input).includes('/partner/orders?status=delivered&limit=20')
            )
        ).toBe(true);
    });

    it('shows a dedicated access state when the account owns no laundry', async () => {
        authenticateTestUser();
        vi.stubGlobal(
            'fetch',
            vi.fn(() =>
                Promise.resolve(apiError('FORBIDDEN', 'A laundry-owner account is required.', 403))
            )
        );

        renderApp('/partner/orders');

        expect(
            await screen.findByRole('heading', { name: 'Laundry-owner access required' })
        ).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
        expect(screen.getByRole('link', { name: 'Return home' })).toHaveAttribute('href', '/');
    });

    it('keeps the loaded queue visible when a later page fails', async () => {
        const user = userEvent.setup();
        authenticateTestUser();
        installPartnerApi({ failPagination: true });
        renderApp('/partner/orders');

        expect(await screen.findByText(FIRST_ORDER.recipient.name)).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Load more orders' }));

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'The next page could not be loaded.'
        );
        expect(screen.getByText(FIRST_ORDER.recipient.name)).toBeInTheDocument();
        expect(screen.queryByText(SECOND_ORDER.recipient.name)).toBeNull();
        expect(screen.queryByRole('button', { name: 'Load more orders' })).toBeNull();
        expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    });

    it('shows operational detail and confirms a status change before sending it', async () => {
        const user = userEvent.setup();
        authenticateTestUser();
        const fetch = installPartnerApi();
        renderApp(`/partner/orders/${FIRST_ORDER.id}`);

        expect(
            await screen.findByRole('heading', { name: FIRST_ORDER.reference })
        ).toBeInTheDocument();
        expect(screen.getByText('Asha Rao')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: '+91 90000 00101' })).toHaveAttribute(
            'href',
            'tel:+919000000101'
        );
        expect(screen.getByText(/Near the park/)).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Confirm order' }));
        const confirmation = screen.getByRole('alertdialog');
        expect(
            within(confirmation).getByRole('heading', { name: 'Confirm this order?' })
        ).toBeInTheDocument();
        expect(fetch.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false);

        await user.click(within(confirmation).getByRole('button', { name: 'Confirm order' }));

        expect(
            await screen.findByRole('button', { name: 'Mark as picked up' })
        ).toBeInTheDocument();
        const mutation = fetch.mock.calls.find(([, init]) => init?.method === 'POST');
        expect(mutation?.[0]).toBe(`/api/v1/partner/orders/${FIRST_ORDER.id}/events`);
        expect(mutation?.[1]).toMatchObject({
            method: 'POST',
            body: JSON.stringify({ type: 'confirmed' }),
        });
        expect(screen.getByText('Order confirmed')).toBeInTheDocument();
    });

    it('surfaces a lifecycle conflict and refreshes the order from the server', async () => {
        const user = userEvent.setup();
        authenticateTestUser();
        const fetch = installPartnerApi({ failTransition: true });
        renderApp(`/partner/orders/${FIRST_ORDER.id}`);

        await user.click(await screen.findByRole('button', { name: 'Confirm order' }));
        await user.click(
            within(screen.getByRole('alertdialog')).getByRole('button', {
                name: 'Confirm order',
            })
        );

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'That order cannot move to the requested stage.'
        );
        expect(
            fetch.mock.calls.filter(
                ([input, init]) =>
                    String(input).endsWith(`/partner/orders/${FIRST_ORDER.id}`) &&
                    init?.method === 'GET'
            )
        ).toHaveLength(2);
    });
});
