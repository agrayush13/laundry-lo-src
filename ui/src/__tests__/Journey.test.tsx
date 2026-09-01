import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SERVICE_TYPES } from '../data/services';
import { CYCLE_HEADER, CYCLE_SECTIONS, DELIVER, DRY, SPIN, WASH } from '../config/cycleConfig';
import { MEMBERSHIP_SECTION } from '../config/membershipConfig';
import { ROUTES } from '../config/navigationConfig';
import { DRY_PARTS } from '../hooks/useClothesline';
import { SPIN_PARTS } from '../hooks/useSpin';
import { renderApp } from '../__mocks__/renderWithProviders';
import { WASH_PARTS } from '../motion/washTimeline';
import { PRESS } from '../pages/journey/scenes/PressShirt';

/** The opening phase's pin input; the footer carries the same one further down. */
const heroPinInput = () => screen.getAllByLabelText(/pin code/i)[0];

describe('the journey', () => {
    it('states the problem in the opening phase', async () => {
        renderApp(ROUTES.journey);

        // Two letters are drawings, so the heading is checked by what it spells:
        // the t of "lost" and the l of "laundry" stay in the DOM behind them.
        const heading = await screen.findByRole('heading', { level: 1 });
        expect(heading.textContent).toBe('Another weekend,lost to laundry.');
    });

    it('renders every phase of the cycle', async () => {
        renderApp(ROUTES.journey);

        for (const section of CYCLE_SECTIONS) {
            expect(await screen.findByRole('region', { name: section.name })).toBeInTheDocument();
        }
    });

    it('explains a short pin code rather than sitting disabled', async () => {
        await openJourney();
        const submit = screen.getAllByRole('button', { name: /find laundries/i })[0]!;

        expect(submit).toBeEnabled();

        await userEvent.type(heroPinInput(), '5600');
        await userEvent.click(submit);

        expect(await screen.findByRole('alert')).toHaveTextContent(/6-digit pin code/i);
        expect(heroPinInput()).toHaveAttribute('aria-invalid', 'true');
    });

    it('ignores non-numeric characters in the pin code', async () => {
        await openJourney();

        await userEvent.type(heroPinInput(), '56ab00');
        expect(heroPinInput()).toHaveValue('5600');
    });

    it('sends each service card into a listing filtered by that service', async () => {
        renderApp(ROUTES.journey);

        const card = await screen.findByRole('link', { name: /wash & fold/i });
        expect(card).toHaveAttribute('href', '/laundries?pin=560103&service=wash-fold');
    });

    it('offers the whole cycle instead of a jump into the middle of it', async () => {
        await openJourney();

        // This was a link to the dry, which answered "how does it work" by
        // dropping the visitor into the fourth sixth of the answer.
        expect(screen.getByRole('button', { name: CYCLE_HEADER.tour.play })).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /how it works/i })).toBeNull();
    });

    it('says plainly that it is a demo', async () => {
        renderApp(ROUTES.journey);
        expect(await screen.findByText(DELIVER.disclaimer)).toBeInTheDocument();
    });
});

/** The journey is a lazy route: nothing exists until the chunk resolves. */
const openJourney = async () => {
    renderApp(ROUTES.journey);
    await screen.findByRole('heading', { level: 1 });
};

describe('the wash', () => {
    it('gives the choreography every part it reaches for', async () => {
        await openJourney();

        // The timeline finds the scene by data-wash hooks. If the markup and the
        // score drift apart, letters fly to the top-left corner of the page and
        // nothing throws, so the contract is asserted here instead.
        WASH_PARTS.forEach((part) => {
            expect(document.querySelector(`[data-wash="${part}"]`)).not.toBeNull();
        });
    });

    it('gives the spin and the dry theirs too', async () => {
        await openJourney();

        // Same contract, same reason, and this one has already been broken: the
        // drum's rotation was written to a node the scene had stopped
        // rendering, so the spin ran with a drum that never turned and nothing
        // anywhere reported a problem.
        await screen.findByRole('region', { name: /the spin/i });
        await screen.findByRole('region', { name: /the dry/i });

        SPIN_PARTS.forEach((part) => {
            expect(document.querySelector(`[data-spin="${part}"]`)).not.toBeNull();
        });

        DRY_PARTS.forEach((part) => {
            expect(document.querySelector(`[data-dry="${part}"]`)).not.toBeNull();
        });
    });

    it('splits the headline into letters the wash can carry one at a time', async () => {
        await openJourney();

        const letters = document.querySelectorAll('[data-wash="letter"]');
        const garments = document.querySelectorAll('[data-wash="letter"][data-glyph]');

        expect(letters.length).toBe('Another weekend,lost to laundry.'.length);
        expect(garments.length).toBe(2);
        expect(document.querySelectorAll('[data-wash="clean-word"]')).toHaveLength(4);
    });
});

describe('the dry', () => {
    it('hangs six garments, each with a pivot the breeze can swing it around', async () => {
        await openJourney();

        const hanging = document.querySelectorAll('[data-dry="garment"]');
        expect(hanging).toHaveLength(6);
        hanging.forEach((garment) => {
            expect(garment.getAttribute('data-pivot')).toMatch(/^[\d.]+ [\d.]+$/);
        });
    });

    it('prints the four steps on the garments and lists them in the markup', async () => {
        await openJourney();

        // Printed on the cloth for anyone looking at it, and a plain ordered
        // list for anyone who is not. The drawing itself is hidden from
        // assistive technology so the steps are announced once, not twice.
        const listed = screen.getAllByRole('listitem').map((item) => item.textContent);
        const printed = Array.from(document.querySelectorAll('svg text')).map(
            (node) => node.textContent
        );

        DRY.steps.forEach((step) => {
            expect(listed).toContain(step.label);
            expect(printed).toContain(step.label);
            expect(printed).toContain(step.number);
        });
    });
});

describe('the spin', () => {
    it('spells its figures out of the strips it lands on', async () => {
        await openJourney();
        await screen.findByRole('region', { name: /the spin/i });

        // Each digit is a window onto a strip of 0-9, and the strip is rolled
        // to `data-digit` and left there. Nothing else decides what the figure
        // reads: if these drifted from the real value, the section would settle
        // confidently onto the wrong number and every check would still pass.
        const faces = Array.from(document.querySelectorAll('[data-spin="slot"]'))
            .map((slot) => slot.getAttribute('data-digit'))
            .join('');

        expect(faces).toBe(SPIN.stats.map((stat) => stat.value).join(''));
    });

    it('starts every strip on the digit it will land on', async () => {
        await openJourney();
        await screen.findByRole('region', { name: /the spin/i });

        // The rest state, which is also what prefers-reduced-motion gets and
        // what is on the screen before the roll starts. The roll is the only
        // thing that ever moves a strip, it runs once on arriving, and it
        // returns to exactly here; scrolling has no say over it in either
        // direction. So the figures are readable at every moment of the visit.
        document.querySelectorAll<HTMLElement>('[data-spin="slot"]').forEach((slot) => {
            expect(slot.style.getPropertyValue('--slot')).toBe(slot.dataset.digit);
        });
    });
});

describe('the fold', () => {
    it('gives the iron a crease to press out on every band it crosses', async () => {
        await openJourney();

        // The iron does not fade the creases out on a timer of its own: each
        // one is rubbed out under the plate that passes over it, which only
        // works while the band a crease is tagged with is a band the iron
        // actually runs along.
        PRESS.bands.forEach((band, index) => {
            const creases = document.querySelectorAll(
                `[data-fold="wrinkle"][data-band="${index}"]`
            );

            expect(creases).toHaveLength(band.creases.length);
            creases.forEach((crease) => {
                expect(crease.getAttribute('pathLength')).toBe('1');
                expect(crease.getAttribute('stroke-dasharray')).toBe('1');
                expect(crease.getAttribute('stroke-dashoffset')).toBe('0');
            });
        });
    });

    it('paints the creases over the cloth rather than under it', async () => {
        await openJourney();

        // They were painted first, which put every panel and the whole tail on
        // top of them: three of the creases could not be seen at all and the
        // other two only showed across the chest. Nothing failed, the ironing
        // simply had almost nothing to do.
        const lower = document.querySelector('[data-fold="lower"]');
        const crease = document.querySelector('[data-fold="wrinkle"]');

        expect(lower).not.toBeNull();
        expect(crease).not.toBeNull();

        const after = lower!.compareDocumentPosition(crease!) & Node.DOCUMENT_POSITION_FOLLOWING;
        expect(after).toBeTruthy();
    });

    it('raises its steam off the cloth, clear of the iron itself', async () => {
        await openJourney();

        // The iron is a solid shape spanning 64 either side of its own origin.
        // A wisp starting inside that is a wisp drawn on top of a lump of
        // metal rather than steam coming off a shirt.
        const wisps = document.querySelectorAll('[data-fold="wisp"]');
        expect(wisps.length).toBeGreaterThan(0);

        wisps.forEach((wisp) => {
            const startsAt = Number(wisp.getAttribute('d')?.match(/^M(-?[\d.]+)/)?.[1]);
            expect(Math.abs(startsAt)).toBeGreaterThan(64);
        });
    });
});

describe('with motion turned off', () => {
    // The spine never boots in this environment, which is the same state
    // prefers-reduced-motion produces: no pins, no timelines, no physics. What
    // is on the page here is what a visitor who has asked for less motion gets.
    it('still says everything the journey had to say', async () => {
        await openJourney();

        // The problem, and the answer to it.
        expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
            'Another weekend,lost to laundry.'
        );
        const cleanLine = WASH.cleanHeadline.map((word) => word.text).join(' ');
        expect(document.querySelector('[data-wash="clean"]')?.textContent?.trim()).toBe(cleanLine);

        // Every service, every step, every perk, and the disclaimer.
        SERVICE_TYPES.forEach((service) => {
            expect(screen.getByText(service.longDescription)).toBeInTheDocument();
        });
        DRY.steps.forEach((step) => {
            expect(screen.getAllByText(step.label).length).toBeGreaterThan(0);
        });
        MEMBERSHIP_SECTION.benefits.forEach((benefit) => {
            expect(screen.getAllByText(new RegExp(benefit.title, 'i')).length).toBeGreaterThan(0);
        });
        expect(await screen.findByText(DELIVER.disclaimer)).toBeInTheDocument();

        // And the ask, at both ends of the page.
        expect(screen.getAllByLabelText(/pin code/i)).toHaveLength(2);
    });
});
