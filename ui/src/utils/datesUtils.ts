export const TIME_SLOTS = [
    '8:00 AM - 10:00 AM',
    '10:00 AM - 12:00 PM',
    '12:00 PM - 2:00 PM',
    '2:00 PM - 4:00 PM',
    '4:00 PM - 6:00 PM',
    '6:00 PM - 8:00 PM',
];

const pad = (value: number) => String(value).padStart(2, '0');

/** ISO date (yyyy-mm-dd) in local time, so it doesn't shift across timezones. */
const toIsoDate = (date: Date) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const upcomingDates = (count: number, from = new Date()) =>
    Array.from({ length: count }, (_, offset) => {
        const date = new Date(from);
        date.setDate(date.getDate() + offset);
        return toIsoDate(date);
    });

const parse = (isoDate: string) => new Date(`${isoDate}T00:00:00`);

export const formatWeekday = (isoDate: string) =>
    parse(isoDate).toLocaleDateString('en-IN', { weekday: 'short' });

export const formatDayOfMonth = (isoDate: string) => String(parse(isoDate).getDate());

export const formatMonth = (isoDate: string) =>
    parse(isoDate).toLocaleDateString('en-IN', { month: 'short' });

export const formatFullDate = (isoDate: string) =>
    parse(isoDate).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

/** ISO timestamp to a short "20 Aug, 10:30 am" for order timelines. */
export const formatEventTime = (isoTimestamp: string) =>
    new Date(isoTimestamp).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
    });

/** ISO timestamp to a plain "20 Aug 2026" date. */
export const formatTimestampDate = (isoTimestamp: string) =>
    new Date(isoTimestamp).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

/** Position of a slot within the day, used to order two slots. */
export const slotIndex = (slot: string) => TIME_SLOTS.indexOf(slot);

/**
 * A delivery must land strictly after its pickup - same day is fine, but only
 * in a later slot.
 */
export const isAfter = (
    candidate: { date: string; slot: string },
    reference: { date: string; slot: string }
) => {
    if (!reference.date || !candidate.date) {
        return true;
    }

    if (candidate.date !== reference.date) {
        return candidate.date > reference.date;
    }

    if (!reference.slot || !candidate.slot) {
        return true;
    }

    return slotIndex(candidate.slot) > slotIndex(reference.slot);
};
