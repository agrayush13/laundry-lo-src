import { TIME_SLOTS, isAfter, upcomingDates } from '../utils/datesUtils';

const [today, tomorrow] = upcomingDates(2);
const [early, , , later] = TIME_SLOTS;

describe('isAfter', () => {
    it('accepts a later date regardless of slot', () => {
        expect(isAfter({ date: tomorrow, slot: early }, { date: today, slot: later })).toBe(true);
    });

    it('rejects an earlier date', () => {
        expect(isAfter({ date: today, slot: later }, { date: tomorrow, slot: early })).toBe(false);
    });

    it('accepts a later slot on the same day', () => {
        expect(isAfter({ date: today, slot: later }, { date: today, slot: early })).toBe(true);
    });

    it('rejects an earlier slot on the same day', () => {
        expect(isAfter({ date: today, slot: early }, { date: today, slot: later })).toBe(false);
    });

    it('rejects the same slot on the same day - delivery cannot equal pickup', () => {
        expect(isAfter({ date: today, slot: early }, { date: today, slot: early })).toBe(false);
    });

    it('is permissive while a selection is still incomplete', () => {
        expect(isAfter({ date: '', slot: '' }, { date: today, slot: early })).toBe(true);
        expect(isAfter({ date: today, slot: early }, { date: '', slot: '' })).toBe(true);
    });
});
