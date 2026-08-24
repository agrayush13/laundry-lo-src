import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { upcomingDates } from '../utils/datesUtils';
import { renderApp } from '../__mocks__/renderWithProviders';
import { dayButton, pickSlot } from '../__mocks__/scheduleQueries';

const [today, tomorrow] = upcomingDates(2);

const fillAddress = async () => {
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Full Name'), 'Ayush A');
    await user.type(screen.getByLabelText('Phone Number'), '9876543210');
    await user.type(screen.getByLabelText(/Flat \/ House No/), 'Flat 402, Tower B');
    await user.type(screen.getByLabelText(/Street \/ Area/), 'MG Road, Sector 5');
    await user.type(screen.getByLabelText('Pincode'), '560103');
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
        const card = screen.getByText('SparkleWash Express').closest('article')!;
        await user.click(within(card).getByRole('link', { name: /book now/i }));
        expect(await screen.findByRole('heading', { name: 'Wash & Fold' })).toBeInTheDocument();

        await user.click(
            await screen.findByRole('button', { name: 'Add Shirt / T-shirt, Wash & Fold' })
        );
        await user.click(screen.getByRole('button', { name: 'View Cart' }));

        expect(await screen.findByRole('heading', { name: 'Your Cart' })).toBeInTheDocument();
        await user.click(await screen.findByRole('button', { name: 'Place Order' }));

        // Checkout collects what the cart could not.
        expect(await screen.findByRole('heading', { name: 'Pickup Address' })).toBeInTheDocument();
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
        expect(screen.getByText(/^Order #LL\d{6}$/)).toBeInTheDocument();
    });

    it('moves focus to the first missing field when confirming early', async () => {
        const user = userEvent.setup();
        renderApp('/laundries/1001');

        await user.click(
            await screen.findByRole('button', { name: 'Add Shirt / T-shirt, Wash & Fold' })
        );
        await user.click(screen.getByRole('button', { name: 'View Cart' }));
        await user.click(await screen.findByRole('button', { name: 'Place Order' }));
        await screen.findByRole('heading', { name: 'Pickup Address' });

        // Everything blank: the name field is the first thing to fix.
        await user.click(screen.getByRole('button', { name: /confirm booking/i }));
        expect(screen.getByLabelText('Full Name')).toHaveFocus();
        expect(screen.getByLabelText('Full Name')).toHaveAttribute('aria-invalid', 'true');

        // Fixing a field clears its message as you type.
        await user.type(screen.getByLabelText('Full Name'), 'Ayush A');
        expect(screen.queryByText('Enter the name we should ask for at pickup.')).toBeNull();
    });

    it('clears a delivery slot that the new pickup would invalidate', async () => {
        const user = userEvent.setup();
        renderApp('/laundries/1001');

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
        renderApp('/laundries/1001');

        await user.click(
            await screen.findByRole('button', { name: 'Add Shirt / T-shirt, Wash & Fold' })
        );
        await user.click(screen.getByRole('button', { name: 'View Cart' }));
        await user.click(await screen.findByRole('button', { name: 'Place Order' }));

        await pickSlot('Pickup', tomorrow);

        expect(dayButton('Delivery', today)).toBeDisabled();
    });

    it('sends an empty cart back rather than showing checkout', async () => {
        renderApp('/checkout');
        expect(await screen.findByText('Your cart is empty.')).toBeInTheDocument();
    });

    it('does not let a closed partner be booked', async () => {
        const user = userEvent.setup();
        renderApp();

        await user.type(screen.getByLabelText(/pin code/i), '560103');
        await user.click(screen.getByRole('button', { name: /find services/i }));

        const closedCard = screen.getByText('FreshPress Studio').closest('article')!;
        expect(within(closedCard).getByText('Currently Closed')).toBeInTheDocument();
        expect(within(closedCard).getByRole('button', { name: /book now/i })).toBeDisabled();
    });
});
