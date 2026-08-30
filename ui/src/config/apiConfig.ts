/**
 * The API is always reached same-origin: webpack's dev server proxies `/api` to
 * the local service, and production is expected to do the same at the edge. That
 * keeps the browser out of CORS entirely and means no build-time URL to get
 * wrong per environment.
 */
export const API_BASE_URL = '/api/v1';

/** Long enough for a cold start, short enough that a hung request still ends. */
export const API_TIMEOUT_MS = 10_000;

export const API_COPY = {
    loading: 'Loading',
    retry: 'Try again',
    networkError: "We couldn't reach laundrylo. Check your connection and try again.",
    unexpectedError: 'Something went wrong on our end. Try again in a moment.',
} as const;
