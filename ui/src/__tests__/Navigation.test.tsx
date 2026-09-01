import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NOT_FOUND_COPY } from '../config/commonConfig';
import { documentTitleFor } from '../config/navigationConfig';
import { renderApp } from '../__mocks__/renderWithProviders';

/**
 * What a client-side navigation owes anyone not watching the screen: a title, an
 * announcement, and somewhere real to land when the URL is wrong.
 */
describe('a URL that does not resolve', () => {
    it('says so rather than redirecting to the homepage', async () => {
        renderApp('/laundries-near-me');

        expect(
            await screen.findByRole('heading', { name: NOT_FOUND_COPY.title })
        ).toBeInTheDocument();
        // The old behaviour was <Navigate to="/" replace>: the visitor arrived
        // somewhere they did not ask for, was told nothing, and Back could not
        // undo it because the bad entry had been replaced.
        expect(screen.queryByRole('heading', { name: /fresh laundry/i })).toBeNull();
    });

    it('offers the two places the visitor was probably headed', async () => {
        renderApp('/nope');

        await screen.findByRole('heading', { name: NOT_FOUND_COPY.title });
        expect(screen.getByRole('link', { name: NOT_FOUND_COPY.home })).toHaveAttribute(
            'href',
            '/'
        );
        expect(screen.getByRole('link', { name: NOT_FOUND_COPY.laundries })).toHaveAttribute(
            'href',
            '/laundries'
        );
    });
});

describe('the document title', () => {
    it('names the route rather than the app on every page', () => {
        expect(documentTitleFor('/')).toBe('laundrylo - Laundry pickup and delivery');
        expect(documentTitleFor('/cart')).toBe('Your cart - laundrylo');
        expect(documentTitleFor('/laundries')).toBe('Laundries near you - laundrylo');
        // The dynamic routes get their pattern's title: the partner's name is
        // not known until its request lands, and a title that arrives late
        // announces the page twice.
        expect(documentTitleFor('/laundries/1001')).toBe('Laundry - laundrylo');
        expect(documentTitleFor('/bookings/ord_01J8XR3K2WQ4')).toBe('Order - laundrylo');
        // The literal route is matched before the dynamic one that would eat it.
        expect(documentTitleFor('/profile')).toBe('Your profile - laundrylo');
        expect(documentTitleFor('/profile/addresses/new')).toBe('Add an address - laundrylo');
    });

    it('changes when the route does, and announces it', async () => {
        const user = userEvent.setup();
        renderApp();
        expect(document.title).toBe(documentTitleFor('/'));

        await user.click((await screen.findAllByRole('link', { name: /book now/i }))[0]!);

        await screen.findByRole('heading', { name: /laundry services/i });
        expect(document.title).toBe(documentTitleFor('/laundries'));
        // The live region carries the same name, because focus alone announces
        // the container rather than the page. AsyncBoundary's loading state is
        // also a status, so this asks whether any of them said it.
        expect(screen.getAllByRole('status').map((region) => region.textContent)).toContain(
            'Laundries near you'
        );
    });
});

describe('the add-address form', () => {
    it('explains what is missing rather than disabling Save', async () => {
        const user = userEvent.setup();
        renderApp('/profile/addresses/new');

        // Signed out, this route redirects to sign in; sign in first.
        await user.type(await screen.findByLabelText('Email'), 'someone@example.com');
        await user.type(screen.getByLabelText('Password'), 'password');
        await user.click(screen.getByRole('button', { name: /^sign in$/i }));

        const save = await screen.findByRole('button', { name: 'Save address' });
        expect(save).toBeEnabled();

        await user.click(save);

        // The label is this form's own field and is the first problem found.
        expect(await screen.findByText(/Name this address/)).toBeInTheDocument();
        expect(screen.getByLabelText('Label')).toHaveAttribute('aria-invalid', 'true');
        // Still on the form: nothing was saved.
        expect(screen.getByRole('button', { name: 'Save address' })).toBeInTheDocument();
    });
});
