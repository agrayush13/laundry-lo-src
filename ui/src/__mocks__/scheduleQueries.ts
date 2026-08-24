import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CHECKOUT_COPY } from '../config/bookingConfig';
import { TIME_SLOTS, formatDayOfMonth } from '../utils/datesUtils';

/**
 * Queries for the checkout schedule pickers.
 *
 * Day buttons are labelled by day of month alone, which collides with the time
 * slots - "4" also matches "4:00 PM - 6:00 PM". Scoping to the date group keeps
 * these queries unambiguous on every date rather than only odd-numbered ones.
 */
const dates = (region: string) =>
    within(
        within(screen.getByRole('region', { name: region })).getByRole('group', {
            name: CHECKOUT_COPY.selectDate,
        })
    );

export const dayButton = (region: string, isoDate: string) =>
    dates(region).getByRole('button', { name: new RegExp(`\\b${formatDayOfMonth(isoDate)}\\b`) });

export const pickSlot = async (region: string, isoDate: string) => {
    const user = userEvent.setup();

    await user.click(dayButton(region, isoDate));
    await user.click(
        within(screen.getByRole('region', { name: region })).getByRole('button', {
            name: TIME_SLOTS[0],
        })
    );
};
