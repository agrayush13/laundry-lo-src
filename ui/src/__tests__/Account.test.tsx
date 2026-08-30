import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { STORAGE_KEYS } from '../config/commonConfig';
import { upcomingDates } from '../utils/datesUtils';
import { renderApp } from '../__mocks__/renderWithProviders';
import { pickSlot } from '../__mocks__/scheduleQueries';

const signIn = async () => {
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('Email'), 'ayush.agrawal@gmail.com');
    await user.type(screen.getByLabelText('Password'), 'hunter2');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));
};

const [today, tomorrow] = upcomingDates(2);

beforeEach(() => window.localStorage.clear());

describe('auth', () => {
    it('discards an incompatible stored user instead of crashing the app', async () => {
        window.localStorage.setItem(STORAGE_KEYS.user, JSON.stringify({ fullName: 'Legacy User' }));
        renderApp();

        expect(await screen.findByRole('link', { name: /sign in/i })).toBeInTheDocument();
    });

    it('keeps the in-memory session working when storage rejects writes', async () => {
        const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new DOMException('Storage unavailable', 'QuotaExceededError');
        });

        try {
            renderApp('/signin');
            await signIn();
            expect(await screen.findByRole('link', { name: /my bookings/i })).toBeInTheDocument();
        } finally {
            write.mockRestore();
        }
    });

    it('discards a malformed versioned cart instead of crashing the app', async () => {
        window.localStorage.setItem(
            STORAGE_KEYS.cart,
            JSON.stringify({ version: 2, partner: null, lines: {}, hasPlus: false })
        );

        renderApp('/cart');

        expect(await screen.findByText('Your cart is empty.')).toBeInTheDocument();
    });

    it('signs in and swaps the header for the account controls', async () => {
        renderApp('/signin');
        await signIn();

        expect(await screen.findByRole('link', { name: /my bookings/i })).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /sign in/i })).toBeNull();
    });

    it('keeps the phone number used for phone sign-in', async () => {
        const user = userEvent.setup();
        renderApp('/signin');

        await user.click(await screen.findByRole('tab', { name: 'Phone' }));
        await user.type(screen.getByLabelText('Phone Number'), '9988776655');
        await user.type(screen.getByLabelText('Password'), 'hunter2');
        await user.click(screen.getByRole('button', { name: 'Sign In' }));
        await user.click(await screen.findByRole('link', { name: /ayush/i }));

        expect(await screen.findByText('9988776655')).toBeInTheDocument();
    });

    it('sends a signed-out visitor to sign in, then back where they were headed', async () => {
        renderApp('/bookings');

        expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
        await signIn();

        expect(await screen.findByRole('heading', { name: 'My Bookings' })).toBeInTheDocument();
    });

    it('signs up with the supplied details', async () => {
        const user = userEvent.setup();
        renderApp('/signup');

        await user.type(await screen.findByLabelText('Full Name'), 'Asha Menon');
        await user.type(screen.getByLabelText('Email'), 'asha@example.com');
        await user.type(screen.getByLabelText('Phone Number'), '9876500000');
        await user.type(screen.getByLabelText('Password'), 'hunter2');
        await user.click(screen.getByRole('button', { name: 'Create Account' }));

        expect(await screen.findByRole('link', { name: /asha/i })).toBeInTheDocument();
    });

    it('returns a new account to the protected page it originally requested', async () => {
        const user = userEvent.setup();
        renderApp('/bookings');

        await user.click(await screen.findByRole('link', { name: 'Sign up' }));
        await user.type(screen.getByLabelText('Full Name'), 'Asha Menon');
        await user.type(screen.getByLabelText('Email'), 'asha@example.com');
        await user.type(screen.getByLabelText('Phone Number'), '9876500000');
        await user.type(screen.getByLabelText('Password'), 'hunter2');
        await user.click(screen.getByRole('button', { name: 'Create Account' }));

        expect(await screen.findByRole('heading', { name: 'My Bookings' })).toBeInTheDocument();
    });

    it('signs out again', async () => {
        renderApp('/signin');
        await signIn();

        await userEvent.setup().click(screen.getByRole('button', { name: 'Sign out' }));
        expect(await screen.findByRole('link', { name: /sign in/i })).toBeInTheDocument();
    });
});

describe('profile', () => {
    const openProfile = async () => {
        renderApp('/signin');
        await signIn();
        await userEvent.setup().click(await screen.findByRole('link', { name: /ayush/i }));
    };

    it('edits personal information and persists it', async () => {
        const user = userEvent.setup();
        await openProfile();

        await user.click(await screen.findByRole('button', { name: 'Edit' }));
        const nameInput = screen.getByLabelText('Full Name');
        await user.clear(nameInput);
        await user.type(nameInput, 'Ayush K Agrawal');
        await user.click(screen.getByRole('button', { name: 'Save Changes' }));

        expect(screen.getByRole('heading', { name: 'Ayush K Agrawal' })).toBeInTheDocument();
        expect(screen.queryByLabelText('Full Name')).toBeNull();
    });

    it('discards edits when cancelled', async () => {
        const user = userEvent.setup();
        await openProfile();

        await user.click(await screen.findByRole('button', { name: 'Edit' }));
        await user.clear(screen.getByLabelText('Full Name'));
        await user.type(screen.getByLabelText('Full Name'), 'Wrong Name');
        // Both the card header and the form offer Cancel; either discards the draft.
        await user.click(screen.getAllByRole('button', { name: 'Cancel' })[0]);

        expect(screen.getByRole('heading', { name: 'Ayush Agrawal' })).toBeInTheDocument();
    });

    it('toggles a notification preference', async () => {
        const user = userEvent.setup();
        await openProfile();

        const emailToggle = await screen.findByRole('switch', { name: 'Email Notifications' });
        expect(emailToggle).toHaveAttribute('aria-checked', 'false');

        await user.click(emailToggle);
        expect(emailToggle).toHaveAttribute('aria-checked', 'true');
    });
});

describe('order tracking', () => {
    it('opens an order and shows its timeline', async () => {
        const user = userEvent.setup();
        renderApp('/signin');
        await signIn();

        await user.click(await screen.findByRole('link', { name: /my bookings/i }));
        await user.click(await screen.findByRole('link', { name: /SparkleWash Express/ }));

        expect(await screen.findByRole('heading', { name: 'LL-2026-001' })).toBeInTheDocument();
        expect(screen.getByText('Clothes Picked Up')).toBeInTheDocument();
        expect(screen.getByText('Order Timeline')).toBeInTheDocument();
        expect(screen.getByText('Delivery Address')).toBeInTheDocument();
    });
});

describe('cart', () => {
    const addTwoServices = async () => {
        const user = userEvent.setup();
        renderApp('/laundries/1001');

        await user.click(
            await screen.findByRole('button', { name: 'Add Shirt / T-shirt, Wash & Fold' })
        );
        await user.click(screen.getByRole('button', { name: 'Add Trousers / Jeans, Wash & Fold' }));
    };

    it('adds items and totals them with tax on the cart page', async () => {
        const user = userEvent.setup();
        await addTwoServices();

        expect(screen.getByText('2 items')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'View Cart' }));
        expect(await screen.findByRole('heading', { name: 'Your Cart' })).toBeInTheDocument();

        // 20 + 30 = 50 subtotal, 18% tax = 9, total 59
        const summary = within(
            screen.getByRole('heading', { name: 'Order Summary' }).closest('section')!
        );
        expect(summary.getByText('₹50')).toBeInTheDocument();
        expect(summary.getByText('₹9')).toBeInTheDocument();
        expect(summary.getByText('₹59')).toBeInTheDocument();
    });

    it('removes a line and empties the cart', async () => {
        const user = userEvent.setup();
        await addTwoServices();
        await user.click(screen.getByRole('button', { name: 'View Cart' }));
        expect(await screen.findByRole('heading', { name: 'Your Cart' })).toBeInTheDocument();

        await user.click(
            screen.getByRole('button', { name: 'Remove Shirt / T-shirt, Wash & Fold' })
        );
        expect(screen.queryByRole('heading', { name: 'Shirt / T-shirt' })).toBeNull();

        await user.click(screen.getByRole('button', { name: 'Clear Cart' }));
        expect(await screen.findByText('Your cart is empty.')).toBeInTheDocument();
    });

    it('offers the account addresses at checkout and reveals a form for a new one', async () => {
        const user = userEvent.setup();
        renderApp('/signin');
        await signIn();

        await addTwoServices();
        await user.click(screen.getByRole('button', { name: 'View Cart' }));
        await user.click(await screen.findByRole('button', { name: 'Place Order' }));

        // Saved addresses are offered instead of an empty form.
        expect(await screen.findByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Office')).toBeInTheDocument();
        expect(screen.getByText(/42, Sector 5, HSR Layout/)).toBeInTheDocument();
        expect(screen.queryByLabelText('Full Name')).toBeNull();

        // Home is preselected, so only the schedule is missing.
        await pickSlot('Pickup', today);
        await pickSlot('Delivery', tomorrow);
        expect(screen.getByRole('button', { name: /confirm booking/i })).toBeEnabled();

        // Choosing "add new" shows the same form as a signed-out visitor gets.
        await user.click(screen.getByRole('radio', { name: /add a new address/i }));
        expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    });

    it('hands off to checkout to collect address and slots', async () => {
        const user = userEvent.setup();
        await addTwoServices();
        await user.click(screen.getByRole('button', { name: 'View Cart' }));
        await user.click(await screen.findByRole('button', { name: 'Place Order' }));

        expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
        await signIn();

        expect(await screen.findByRole('heading', { name: 'Pickup Address' })).toBeInTheDocument();
        expect(
            screen.getByRole('heading', { name: 'Schedule Pickup & Delivery' })
        ).toBeInTheDocument();

        // Confirm stays clickable and points at the first missing detail.
        await user.click(screen.getByRole('button', { name: /confirm booking/i }));
        expect(screen.getByText('Choose a pickup date and time.')).toBeInTheDocument();
    });

    it('asks before replacing items from another laundry', async () => {
        const user = userEvent.setup();
        const first = renderApp('/laundries/1001');

        await user.click(
            await screen.findByRole('button', { name: 'Add Jacket / Coat, Dry Cleaning' })
        );
        first.unmount();

        renderApp('/laundries/1002');
        const add = await screen.findByRole('button', {
            name: 'Add Shirt / T-shirt, Wash & Fold',
        });
        await user.click(add);

        const dialog = screen.getByRole('dialog', { name: 'Start a new cart?' });
        expect(within(dialog).getByText('SparkleWash Express')).toBeInTheDocument();
        expect(within(dialog).getByRole('button', { name: 'Keep current cart' })).toHaveFocus();

        await user.click(within(dialog).getByRole('button', { name: 'Keep current cart' }));
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(add).toHaveFocus();

        await user.click(add);
        const reopened = screen.getByRole('dialog', { name: 'Start a new cart?' });
        const keep = within(reopened).getByRole('button', { name: 'Keep current cart' });
        const replace = within(reopened).getByRole('button', { name: 'Replace cart' });
        await user.tab();
        expect(replace).toHaveFocus();
        await user.tab();
        expect(keep).toHaveFocus();

        await user.click(replace);
        const viewCart = screen.getByRole('button', { name: 'View Cart' });
        expect(viewCart).toHaveFocus();
        await user.click(viewCart);

        expect(await screen.findByText('CleanFold Laundry')).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Jacket / Coat' })).toBeNull();
    });
});
