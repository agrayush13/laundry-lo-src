/**
 * One failure shape for every endpoint, per docs/api-contract.md section 1.
 * `code` is the stable machine string the UI switches on; `message` is safe to
 * put in front of a user.
 */

export type ErrorCode =
    | 'VALIDATION_FAILED'
    | 'UNAUTHENTICATED'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'PARTNER_NOT_FOUND'
    | 'PROFILE_NOT_FOUND'
    | 'ADDRESS_NOT_FOUND'
    | 'CART_NOT_FOUND'
    | 'CART_EMPTY'
    | 'CART_CHANGED'
    | 'CART_PARTNER_CONFLICT'
    | 'PARTNER_CLOSED'
    | 'SLOT_UNAVAILABLE'
    | 'IDEMPOTENCY_KEY_REQUIRED'
    | 'RATE_LIMITED'
    | 'INTERNAL_ERROR';

const STATUS_BY_CODE: Record<ErrorCode, number> = {
    VALIDATION_FAILED: 422,
    UNAUTHENTICATED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    PARTNER_NOT_FOUND: 404,
    PROFILE_NOT_FOUND: 404,
    ADDRESS_NOT_FOUND: 404,
    CART_NOT_FOUND: 404,
    CART_EMPTY: 422,
    CART_CHANGED: 409,
    CART_PARTNER_CONFLICT: 409,
    PARTNER_CLOSED: 409,
    SLOT_UNAVAILABLE: 409,
    IDEMPOTENCY_KEY_REQUIRED: 400,
    RATE_LIMITED: 429,
    INTERNAL_ERROR: 500,
};

export class ApiError extends Error {
    readonly code: ErrorCode;
    readonly status: number;
    readonly fields: Record<string, string> | undefined;

    constructor(code: ErrorCode, message: string, fields?: Record<string, string>) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.status = STATUS_BY_CODE[code];
        this.fields = fields;
    }
}

export const partnerNotFound = () =>
    new ApiError('PARTNER_NOT_FOUND', 'That laundry is no longer listed.');
export const validationFailed = (fields: Record<string, string>) =>
    new ApiError(
        'VALIDATION_FAILED',
        Object.values(fields)[0] ?? 'Some details need fixing.',
        fields
    );

export interface ErrorBody {
    error: {
        code: ErrorCode;
        message: string;
        fields?: Record<string, string>;
        requestId: string;
    };
}

export const toErrorBody = (error: ApiError, requestId: string): ErrorBody => ({
    error: {
        code: error.code,
        message: error.message,
        ...(error.fields ? { fields: error.fields } : {}),
        requestId,
    },
});
