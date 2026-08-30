const pad = (value: number) => String(value).padStart(2, '0');
const PARTNER_TIME_ZONE = 'Asia/Kolkata';

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
        timeZone: PARTNER_TIME_ZONE,
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
    });

/** ISO timestamp to a plain "20 Aug 2026" date. */
export const formatTimestampDate = (isoTimestamp: string) =>
    new Date(isoTimestamp).toLocaleDateString('en-IN', {
        timeZone: PARTNER_TIME_ZONE,
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

const formatTimeOfDay = (isoTimestamp: string) =>
    new Date(isoTimestamp).toLocaleTimeString('en-IN', {
        timeZone: PARTNER_TIME_ZONE,
        hour: 'numeric',
        minute: '2-digit',
    });

/**
 * A slot's two instants as one readable window, e.g. "8:00 am - 10:00 am".
 * The server sends instants and never display strings, so this is the only
 * place a slot acquires a label. The service is in Bengaluru, so its wall-clock
 * time must not shift when a customer opens the page from another timezone.
 */
export const formatSlotRange = (startsAt: string, endsAt: string) =>
    `${formatTimeOfDay(startsAt)} - ${formatTimeOfDay(endsAt)}`;

/**
 * A delivery must land strictly after its pickup - same day is fine, but only
 * in a later slot. Slots are ordered by when they actually start rather than by
 * their position in a fixed list, so a partner adding an evening window does not
 * reorder anything.
 */
export const isAfter = (
    candidate: { date: string; startsAt: string },
    reference: { date: string; startsAt: string }
) => {
    if (!reference.date || !candidate.date) {
        return false;
    }

    if (candidate.date !== reference.date) {
        return candidate.date > reference.date;
    }

    if (!reference.startsAt || !candidate.startsAt) {
        return false;
    }

    return Date.parse(candidate.startsAt) > Date.parse(reference.startsAt);
};
