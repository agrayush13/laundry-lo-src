import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { upcomingDates } from '../utils/datesUtils';
import { authenticateTestUser, renderApp } from '../__mocks__/renderWithProviders';
import { dayButton, pickSlot, slotButtons, waitForSchedule } from '../__mocks__/scheduleQueries';

const [today, tomorrow] = upcomingDates(2);

const fillAddress = async () => {
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Full Name'), 'Ayush A');
    await user.type(screen.getByLabelText('Phone Number'), '9876543210');
    await user.type(screen.getByLabelText(/Flat \/ House No/), 'Flat 402, Tower B');
    await user.type(screen.getByLabelText(/Street \/ Area/), 'MG Road, Sector 5');
    await user.type(screen.getByLabelText('Pincode'), '560103');
};

const signIn = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.type(await screen.findByLabelText('Email'), 'ayush.agrawal@gmail.com');
    await user.type(screen.getByLabelText('Password'), 'hunter2');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));
};

const renderSignedIn = (path: string) => {
    authenticateTestUser();
    return renderApp(path);
};

describe('order flow', () => {
    it('takes a customer from pin code search to a confirmed order', async () => {
        const user = userEvent.setup();
        renderApp();

        await user.type(screen.getByLabelText(/pin code/i), '560103');
        await user.click(screen.getByRole('button', { name: /find services/i }));
        expect(
            await screen.findByRole('heading', { name: /laundry services near 560103/i })
        ).toBeInTheDocument();

        // Book Now opens the partner menu - there is no separate wizard any more.
        // The listing is a request now, so the card arrives rather than being there.
        const card = (await screen.findByText('SparkleWash Express')).closest('article')!;
        await user.click(within(card).getByRole('link', { name: /book now/i }));
        expect(await screen.findByRole('heading', { name: 'Wash & Fold' })).toBeInTheDocument();

        await user.click(
            await screen.findByRole('button', { name: 'Add Shirt / T-shirt, Wash & Fold' })
        );
        await user.click(screen.getByRole('button', { name: 'View Cart' }));

        expect(await screen.findByRole('heading', { name: 'Your Cart' })).toBeInTheDocument();
        // The line names the service it was added from, which the client can no
        // longer look up: the catalogue that priced it lives on the server.
        expect(screen.getByText('Wash & Fold')).toBeInTheDocument();
        await user.click(await screen.findByRole('button', { name: 'Place Order' }));

        // A cart works signed out, but placing it requires an account and then
        // returns the customer to the checkout they asked for.
        expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
        await signIn(user);

        // Checkout collects what the cart could not. Choose a new address so
        // this full journey exercises validation instead of using the fixture.
        expect(await screen.findByRole('heading', { name: 'Pickup Address' })).toBeInTheDocument();
        await user.click(screen.getByRole('radio', { name: /add a new address/i }));
        const confirm = () => screen.getByRole('button', { name: /confirm booking/i });

        // Submitting early explains what is missing rather than doing nothing.
        await user.click(confirm());
        expect(screen.getByText('Enter the name we should ask for at pickup.')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Pickup Address' })).toBeInTheDocument();

        await fillAddress();
        await pickSlot('Pickup', today);
        await pickSlot('Delivery', tomorrow);

        expect(confirm()).toBeEnabled();
        await user.click(confirm());

        expect(
            await screen.findByRole('heading', { name: /booking confirmed/i })
        ).toBeInTheDocument();
        // The friendly reference, not the lookup id: `LL-2026-4821`. The two are
        // separate values now, and only this one is ever shown.
        expect(screen.getByText(/^Order #LL-\d{4}-\d{4}$/)).toBeInTheDocument();
    });

    it('moves focus to the first missing field when confirming early', async () => {
        const user = userEvent.setup();
        renderSignedIn('/laundries/1001');

        await user.click(
            await screen.findByRole('button', { name: 'Add Shirt / T-shirt, Wash & Fold' })
        );
        await user.click(screen.getByRole('button', { name: 'View Cart' }));
        await user.click(await screen.findByRole('button', { name: 'Place Order' }));
        await screen.findByRole('heading', { name: 'Pickup Address' });
        await user.click(screen.getByRole('radio', { name: /add a new address/i }));

        // Everything blank: the name field is the first thing to fix.
        await user.click(screen.getByRole('button', { name: /confirm booking/i }));
        expect(screen.getByLabelText('Full Name')).toHaveFocus();
        expect(screen.getByLabelText('Full Name')).toHaveAttribute('aria-invalid', 'true');

        // Fixing a field clears its message as you type.
        await user.type(screen.getByLabelText('Full Name'), 'Ayush A');
        expect(screen.queryByText('Enter the name we should ask for at pickup.')).toBeNull();
    });

    it('rejects non-dialable phone numbers and non-numeric pincodes', async () => {
        const user = userEvent.setup();
        renderSignedIn('/laundries/1001');

        await user.click(
            await screen.findByRole('button', { name: 'Add Shirt / T-shirt, Wash & Fold' })
        );
        await user.click(screen.getByRole('button', { name: 'View Cart' }));
        await user.click(await screen.findByRole('button', { name: 'Place Order' }));
        await user.click(await screen.findByRole('radio', { name: /add a new address/i }));

        await user.type(await screen.findByLabelText('Full Name'), 'Test User');
        await user.type(screen.getByLabelText('Phone Number'), 'x');
        await user.type(screen.getByLabelText(/Flat \/ House No/), '1');
        await user.type(screen.getByLabelText(/Street \/ Area/), 'Test Street');
        await user.type(screen.getByLabelText('Pincode'), 'abcdef');
        await pickSlot('Pickup', today!);
        await pickSlot('Delivery', tomorrow!);
        await user.click(screen.getByRole('button', { name: /confirm booking/i }));

        expect(screen.getByText('Enter a phone number our driver can reach.')).toBeInTheDocument();
        expect(screen.getByText('Enter a 6-digit pincode.')).toBeInTheDocument();
        expect(screen.getByLabelText('Phone Number')).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByLabelText('Pincode')).toHaveAttribute('aria-invalid', 'true');
        expect(screen.queryByRole('heading', { name: /booking confirmed/i })).toBeNull();
    });

    it('clears a delivery slot that the new pickup would invalidate', async () => {
        const user = userEvent.setup();
        renderSignedIn('/laundries/1001');

        await user.click(
            await screen.findByRole('button', { name: 'Add Shirt / T-shirt, Wash & Fold' })
        );
        await user.click(screen.getByRole('button', { name: 'View Cart' }));
        await user.click(await screen.findByRole('button', { name: 'Place Order' }));
        await screen.findByRole('heading', { name: 'Pickup Address' });

        await pickSlot('Pickup', today);
        await pickSlot('Delivery', tomorrow);

        expect(dayButton('Delivery', tomorrow)).toHaveAttribute('aria-pressed', 'true');

        // Moving pickup past the delivery must not leave the old choice standing.
        const [, , dayAfter] = upcomingDates(3);
        await pickSlot('Pickup', dayAfter);
        expect(dayButton('Delivery', tomorrow)).toHaveAttribute('aria-pressed', 'false');
    });

    it('blocks a delivery date earlier than the pickup date', async () => {
        const user = userEvent.setup();
        renderSignedIn('/laundries/1001');

        await user.click(
            await screen.findByRole('button', { name: 'Add Shirt / T-shirt, Wash & Fold' })
        );
        await user.click(screen.getByRole('button', { name: 'View Cart' }));
        await user.click(await screen.findByRole('button', { name: 'Place Order' }));

        await pickSlot('Pickup', tomorrow);

        expect(dayButton('Delivery', today)).toBeDisabled();
    });

    it('will not offer a slot the partner has already filled', async () => {
        const user = userEvent.setup();
        renderSignedIn('/laundries/1001');

        await user.click(
            await screen.findByRole('button', { name: 'Add Shirt / T-shirt, Wash & Fold' })
        );
        await user.click(screen.getByRole('button', { name: 'View Cart' }));
        await user.click(await screen.findByRole('button', { name: 'Place Order' }));

        await waitForSchedule('Pickup');
        await user.click(dayButton('Pickup', today));

        // Capacity is the server's to know; the client only renders what it is
        // told, and a full window is not clickable.
        const unavailable = slotButtons('Pickup').filter((button) =>
            button.hasAttribute('disabled')
        );
        expect(unavailable.length).toBeGreaterThan(0);
    });

    it('sends an empty cart back rather than showing checkout', async () => {
        renderSignedIn('/checkout');
        expect(await screen.findByText('Your cart is empty.')).toBeInTheDocument();
    });

    it('does not let a closed partner be booked', async () => {
        const user = userEvent.setup();
        renderApp();

        // FreshPress is the closed one, and it is in 560102.
        await user.type(screen.getByLabelText(/pin code/i), '560102');
        await user.click(screen.getByRole('button', { name: /find services/i }));

        const closedCard = (await screen.findByText('FreshPress Studio')).closest('article')!;
        expect(within(closedCard).getByText('Currently Closed')).toBeInTheDocument();
        expect(within(closedCard).getByRole('button', { name: /book now/i })).toBeDisabled();
    });
});
