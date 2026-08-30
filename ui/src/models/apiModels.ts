/** Cursor-paginated collections. Absent `nextCursor` means the end. */
export interface Page<T> {
    data: T[];
    nextCursor: string | null;
}

/**
 * Stable machine strings the UI switches on. `NETWORK_ERROR` is the client's
 * own: it is the one failure the server never gets to report.
 */
export type ApiErrorCode =
    | 'VALIDATION_FAILED'
    | 'UNAUTHENTICATED'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'PARTNER_NOT_FOUND'
    | 'CART_PARTNER_CONFLICT'
    | 'SLOT_UNAVAILABLE'
    | 'IDEMPOTENCY_KEY_REQUIRED'
    | 'RATE_LIMITED'
    | 'INTERNAL_ERROR'
    | 'NETWORK_ERROR';

export interface ApiErrorBody {
    error: {
        code: ApiErrorCode;
        message: string;
        fields?: Record<string, string>;
        requestId: string;
    };
}
