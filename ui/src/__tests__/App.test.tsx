import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SERVICE_TYPES } from '../data/services';
import { DRY, SPIN } from '../config/cycleConfig';
import { HERO, HOW_IT_WORKS_SECTION } from '../config/homeConfig';
import { MEMBERSHIP_SECTION } from '../config/membershipConfig';
import { PRIMARY_NAV, ROUTES } from '../config/navigationConfig';
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

    it('does not advertise the journey', () => {
        renderApp();

        // Reachable by typing the URL and by nothing else. The route still
        // resolves; the header simply does not send anybody there, because a
        // visitor who came to price a wash should not be offered the scenic
        // route as one of four things in the nav.
        expect(screen.queryByRole('link', { name: 'Journey' })).toBeNull();
        PRIMARY_NAV.forEach(({ href }) => expect(href).not.toBe(ROUTES.journey));
    });

    it('carries the app chrome, which the journey does not', () => {
        renderApp();

        // The shared header and footer. The journey suppresses both, because it
        // brings its own; every other route, this one included, keeps them.
        expect(screen.getByRole('contentinfo')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'How It Works' })).toHaveAttribute(
            'href',
            '/#how-it-works'
        );
    });
});

/**
 * The homepage and the journey tell the same story twice. Every figure below is
 * asserted against the one source it comes from, because the two drifting apart
 * is not a rendering bug anybody would notice: it is simply the site quoting two
 * different numbers for the same thing, on two pages, forever. This page claimed
 * five hundred partner laundries while the journey counted fifty two.
 */
describe('the homepage and the journey agree', () => {
    it('quotes the same three figures', () => {
        renderApp();

        SPIN.stats.forEach((stat) => {
            expect(screen.getByText(`${stat.value}${stat.suffix ?? ''}`)).toBeInTheDocument();
        });
        expect(HERO.stats).toHaveLength(SPIN.stats.length);
    });

    it('names the same four steps, in the same order', () => {
        renderApp();

        const titles = HOW_IT_WORKS_SECTION.steps.map((step) => step.title.toLowerCase());
        expect(titles).toEqual(DRY.steps.map((step) => step.label));

        titles.forEach((title) => {
            expect(
                screen.getByRole('heading', { name: new RegExp(title, 'i') })
            ).toBeInTheDocument();
        });
    });

    it('lists every service, not a hand-picked few', () => {
        renderApp();

        SERVICE_TYPES.forEach((service) => {
            expect(screen.getByRole('heading', { name: service.name })).toBeInTheDocument();
        });
    });

    it('promises the perks the cart actually applies', () => {
        renderApp();

        MEMBERSHIP_SECTION.benefits.forEach((benefit) => {
            expect(screen.getByText(benefit.title)).toBeInTheDocument();
        });
    });
});
