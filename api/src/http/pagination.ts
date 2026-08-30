import { validationFailed } from './errors.js';

/**
 * Keyset cursors, not offsets: the listing is sorted by rating or distance, and
 * an offset would skip or repeat rows whenever a partner's rating changed
 * between two pages.
 *
 * The cursor is opaque to the client - base64 of the sort key and the id it was
 * read from - so its shape can change without a client release.
 */
export interface Cursor {
    /** The sort value of the last row on the previous page. */
    key: number;
    id: string;
    /** The normalized sort and filters that minted this cursor. */
    scope: string;
}

export const encodeCursor = (cursor: Cursor): string =>
    Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');

export const decodeCursor = (raw: string | undefined, expectedScope: string): Cursor | null => {
    if (!raw) return null;
    try {
        const parsed: unknown = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
        if (
            typeof parsed === 'object' &&
            parsed !== null &&
            typeof (parsed as Cursor).key === 'number' &&
            typeof (parsed as Cursor).id === 'string' &&
            typeof (parsed as Cursor).scope === 'string' &&
            (parsed as Cursor).scope === expectedScope
        ) {
            return parsed as Cursor;
        }
    } catch {
        // Falls through to the validation error below.
    }
    throw validationFailed({ cursor: 'That page link is no longer valid.' });
};

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 50;
