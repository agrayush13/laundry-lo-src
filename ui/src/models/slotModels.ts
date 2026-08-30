/**
 * Slots come from the server and are never invented here: capacity, opening
 * hours and holidays all live there, and `available` is the only thing that can
 * stop a customer booking a full slot.
 */
export interface Slot {
    id: string;
    /** ISO 8601 UTC. The client formats it in the partner's timezone. */
    startsAt: string;
    endsAt: string;
    available: boolean;
}

export interface SlotDay {
    /** ISO date, e.g. 2026-08-26, in the partner's own timezone. */
    date: string;
    slots: Slot[];
}
