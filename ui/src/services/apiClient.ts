import { ApiErrorBody, ApiErrorCode } from '../models/apiModels';
import { API_BASE_URL, API_COPY, API_TIMEOUT_MS } from '../config/apiConfig';

/**
 * Every failure reaching a component is one of these, whether it came from the
 * server's error envelope, a dead connection or a response that wasn't JSON.
 * Components switch on `code` and show `message`, which is always safe to read.
 */
export class ApiError extends Error {
    readonly code: ApiErrorCode;
    readonly status: number;
    readonly fields: Record<string, string> | undefined;
    readonly requestId: string | undefined;

    constructor(
        code: ApiErrorCode,
        message: string,
        status = 0,
        fields?: Record<string, string>,
        requestId?: string
    ) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.status = status;
        this.fields = fields;
        this.requestId = requestId;
    }
}

const isErrorBody = (body: unknown): body is ApiErrorBody =>
    typeof body === 'object' &&
    body !== null &&
    typeof (body as ApiErrorBody).error?.code === 'string';

/** Undefined and empty values are dropped rather than sent as `?tags=`. */
export type QueryParams = Record<string, string | number | string[] | undefined>;

const toQueryString = (params: QueryParams = {}) => {
    const search = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
        if (value === undefined) continue;

        if (Array.isArray(value)) {
            if (value.length > 0) search.set(key, value.join(','));
            continue;
        }

        const text = String(value);
        if (text !== '') search.set(key, text);
    }

    const query = search.toString();
    return query ? `?${query}` : '';
};

export interface RequestOptions {
    params?: QueryParams;
    signal?: AbortSignal;
}

export const apiGet = async <T>(path: string, { params, signal }: RequestOptions = {}) => {
    // A request the caller abandoned and one that timed out are both aborts, so
    // the two signals are combined and the caller's reason wins.
    const timeout = new AbortController();
    const timer = setTimeout(() => timeout.abort(), API_TIMEOUT_MS);
    const onAbort = () => timeout.abort();
    signal?.addEventListener('abort', onAbort);

    let response: Response;
    let body: unknown;
    let hasMalformedBody = false;
    try {
        response = await fetch(`${API_BASE_URL}${path}${toQueryString(params)}`, {
            headers: { Accept: 'application/json' },
            signal: timeout.signal,
        });
        body = await response.json().catch((error: unknown) => {
            // Malformed JSON is handled as an unexpected response below. An
            // abort while streaming the body must still end as a timeout.
            if (timeout.signal.aborted) throw error;
            hasMalformedBody = true;
            return null;
        });
    } catch (error) {
        // An abort the caller asked for is not a failure to report; it is the
        // caller having moved on, and it must not become an error state.
        if (signal?.aborted) throw error;
        throw new ApiError('NETWORK_ERROR', API_COPY.networkError);
    } finally {
        clearTimeout(timer);
        signal?.removeEventListener('abort', onAbort);
    }

    if (hasMalformedBody) {
        throw new ApiError('INTERNAL_ERROR', API_COPY.unexpectedError, response.status);
    }

    if (!response.ok) {
        if (isErrorBody(body)) {
            throw new ApiError(
                body.error.code,
                body.error.message,
                response.status,
                body.error.fields,
                body.error.requestId
            );
        }
        // A proxy or a crash can answer with something that is not our envelope.
        throw new ApiError('INTERNAL_ERROR', API_COPY.unexpectedError, response.status);
    }

    return body as T;
};
