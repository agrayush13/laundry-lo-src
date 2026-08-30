import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CHECKOUT_COPY } from '../config/bookingConfig';
import { formatDayOfMonth } from '../utils/datesUtils';

/**
 * Queries for the checkout schedule pickers.
 *
 * Day buttons are labelled by day of month alone, which collides with the time
 * slots - "4" also matches "4:00 pm - 6:00 pm". Scoping to the date group keeps
 * these queries unambiguous on every date rather than only odd-numbered ones.
 */
const picker = (region: string) => within(screen.getByRole('region', { name: region }));

const group = (region: string, label: string) =>
    within(picker(region).getByRole('group', { name: label }));

export const dayButton = (region: string, isoDate: string) =>
    group(region, CHECKOUT_COPY.selectDate).getByRole('button', {
        name: new RegExp(`\\b${formatDayOfMonth(isoDate)}\\b`),
    });

export const slotButtons = (region: string) =>
    group(region, CHECKOUT_COPY.selectSlot).getAllByRole('button');

/** Waits for the slots to arrive before the picker can be driven at all. */
export const waitForSchedule = async (region: string) =>
    screen.findByRole('region', { name: region });

/**
 * Slots are the server's now, so the first *available* one is chosen rather
 * than a hardcoded label: which windows exist is the partner's business.
 */
export const pickSlot = async (region: string, isoDate: string) => {
    const user = userEvent.setup();
    await waitForSchedule(region);

    await user.click(dayButton(region, isoDate));

    const available = slotButtons(region).find((button) => !button.hasAttribute('disabled'));
    if (!available) {
        throw new Error(`No available slot on ${isoDate} in the ${region} picker.`);
    }
    await user.click(available);
};
