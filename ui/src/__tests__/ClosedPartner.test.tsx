import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { API_COPY } from '../config/apiConfig';
import { CHECKOUT_COPY, VALIDATION_COPY } from '../config/bookingConfig';
import { CART_COPY } from '../config/cartConfig';
import { LISTING_COPY } from '../config/listingConfig';
import { PARTNER_COPY } from '../config/partnerConfig';
import { fixtureFetch } from '../__mocks__/apiFixtures';
import { authenticateTestUser, renderApp } from '../__mocks__/renderWithProviders';

/**
 * "A closed partner cannot take orders" is a product rule, and it used to be
 * kept by one disabled button on one card. Everything below is a route that
 * walked straight past it. FreshPress Studio (1004) is the closed one in both
 * the fixture and the seed.
 */
describe('a closed partner', () => {
    it('does not link its own name from the listing', async () => {
        renderApp('/laundries?pin=560102');

        const name = await screen.findByText('FreshPress Studio');
        // The Book button beside it is disabled; the name was a live route to
        // the same menu, one tab stop away.
        expect(name.closest('a')).toBeNull();

        // An open partner in the same list is still linked.
        expect(screen.getByText('Royal Dry Cleaners').closest('a')).toHaveAttribute(
            'href',
            '/laundries/1003'
        );
    });

    it('still says so on the card', async () => {
        renderApp('/laundries?pin=560102');

        const card = (await screen.findByText('FreshPress Studio')).closest('article')!;
        expect(within(card).getByText(LISTING_COPY.closed)).toBeInTheDocument();
        expect(within(card).getByRole('button', { name: LISTING_COPY.book })).toBeDisabled();
    });

    it('shows why, and no price list, when reached by direct URL', async () => {
        renderApp('/laundries/1004');

        expect(
            await screen.findByRole('heading', { name: PARTNER_COPY.closedTitle })
        ).toBeInTheDocument();

        // The menu is not rendered at all: every Add on it leads to a checkout
        // the partner cannot honour.
        expect(screen.queryByRole('heading', { name: 'Wash & Fold' })).toBeNull();
        expect(screen.queryByRole('button', { name: new RegExp(CART_COPY.add) })).toBeNull();
    });

    it('refuses the booking when it closes between the cart and confirming', async () => {
        const user = userEvent.setup();
        authenticateTestUser();

        // Open while the cart is filled, shut by the time checkout asks. This is
        // exactly why the cart's remembered partner cannot answer the question:
        // `isOpen` is a switch, and the answer has to be current.
        let shut = false;
        vi.stubGlobal(
            'fetch',
            vi.fn(async (input: RequestInfo | URL) => {
                const response = fixtureFetch(input);
                if (
                    !shut ||
                    !/\/partners\/1001$/.test(new URL(String(input), 'http://x').pathname)
                ) {
                    return response;
                }

                const partner = (await response.json()) as Record<string, unknown>;
                return new Response(JSON.stringify({ ...partner, isOpen: false }), {
                    headers: { 'Content-Type': 'application/json' },
                });
            })
        );

        renderApp('/laundries/1001');
        await user.click(
            await screen.findByRole('button', { name: 'Add Shirt / T-shirt, Wash & Fold' })
        );
        await user.click(screen.getByRole('button', { name: 'View Cart' }));
        await screen.findByRole('heading', { name: 'Your Cart' });

        shut = true;
        await user.click(await screen.findByRole('button', { name: 'Place Order' }));
        await screen.findByRole('heading', { name: 'Pickup Address' });

        await user.click(screen.getByRole('button', { name: /confirm booking/i }));

        expect(await screen.findByText(VALIDATION_COPY.partnerClosed)).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: /booking confirmed/i })).toBeNull();
    });

    it('does not confirm while current partner availability cannot be verified', async () => {
        const user = userEvent.setup();
        authenticateTestUser();
        let unavailable = false;

        vi.stubGlobal(
            'fetch',
            vi.fn(async (input: RequestInfo | URL) => {
                if (
                    unavailable &&
                    /\/partners\/1001$/.test(new URL(String(input), 'http://x').pathname)
                ) {
                    throw new TypeError('offline');
                }
                return fixtureFetch(input);
            })
        );

        renderApp('/laundries/1001');
        await user.click(
            await screen.findByRole('button', { name: 'Add Shirt / T-shirt, Wash & Fold' })
        );
        await user.click(screen.getByRole('button', { name: 'View Cart' }));

        unavailable = true;
        await user.click(await screen.findByRole('button', { name: 'Place Order' }));

        expect(await screen.findByRole('alert')).toHaveTextContent(
            CHECKOUT_COPY.partnerCheckFailed
        );
        expect(screen.getByRole('button', { name: /confirm booking/i })).toBeDisabled();

        unavailable = false;
        await user.click(screen.getByRole('button', { name: API_COPY.retry }));
        await waitFor(() =>
            expect(screen.getByRole('button', { name: /confirm booking/i })).toBeEnabled()
        );
    });
});
