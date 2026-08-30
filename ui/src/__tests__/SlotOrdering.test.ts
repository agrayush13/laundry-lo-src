import { formatSlotRange, isAfter, upcomingDates } from '../utils/datesUtils';

const [today, tomorrow] = upcomingDates(2);

/** Two windows on the same day, as the API sends them: instants, not labels. */
const at = (date: string, hour: number) =>
    new Date(`${date}T${String(hour).padStart(2, '0')}:00:00+05:30`).toISOString();

const early = (date: string) => ({ date, startsAt: at(date, 8) });
const later = (date: string) => ({ date, startsAt: at(date, 16) });

describe('isAfter', () => {
    it('accepts a later date regardless of slot', () => {
        expect(isAfter(early(tomorrow!), later(today!))).toBe(true);
    });

    it('rejects an earlier date', () => {
        expect(isAfter(later(today!), early(tomorrow!))).toBe(false);
    });

    it('accepts a later slot on the same day', () => {
        expect(isAfter(later(today!), early(today!))).toBe(true);
    });

    it('rejects an earlier slot on the same day', () => {
        expect(isAfter(early(today!), later(today!))).toBe(false);
    });

    it('rejects the same slot on the same day - delivery cannot equal pickup', () => {
        expect(isAfter(early(today!), early(today!))).toBe(false);
    });

    it('does not claim incomplete selections are ordered', () => {
        expect(isAfter({ date: '', startsAt: '' }, early(today!))).toBe(false);
        expect(isAfter(early(today!), { date: '', startsAt: '' })).toBe(false);
    });
});

describe('slot labels', () => {
    it('uses the Bengaluru partner time rather than the browser timezone', () => {
        expect(formatSlotRange('2026-08-30T02:30:00.000Z', '2026-08-30T04:30:00.000Z')).toBe(
            '8:00 am - 10:00 am'
        );
    });
});
