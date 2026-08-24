import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../__mocks__/renderWithProviders';

describe('App', () => {
    it('renders the hero heading', () => {
        renderApp();
        expect(
            screen.getByRole('heading', { name: /fresh laundry, delivered to your door/i })
        ).toBeInTheDocument();
    });

    it('enables the search only once a full pin code is entered', async () => {
        renderApp();
        const input = screen.getByLabelText(/pin code/i);
        const submit = screen.getByRole('button', { name: /find services/i });

        expect(submit).toBeDisabled();

        await userEvent.type(input, '560001');
        expect(submit).toBeEnabled();
    });

    it('renders every homepage section', () => {
        renderApp();
        const sections = [
            'Our Services',
            'How It Works',
            'Upgrade to LaundryLo Plus',
            'Loved by Thousands',
            'Ready to ditch laundry day?',
        ];

        sections.forEach((name) => {
            expect(screen.getByRole('heading', { name })).toBeInTheDocument();
        });
    });

    it('ignores non-numeric characters in the pin code', async () => {
        renderApp();
        const input = screen.getByLabelText(/pin code/i);

        await userEvent.type(input, '56ab00');
        expect(input).toHaveValue('5600');
    });
});
