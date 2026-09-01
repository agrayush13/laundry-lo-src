import { ROUTES } from '../config/navigationConfig';

/** Auth redirects may only return to this SPA, never an external URL. */
export const safeAuthDestination = (value: unknown, fallback = ROUTES.home) => {
    if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
        return fallback;
    }

    try {
        const destination = new URL(value, window.location.origin);
        return destination.origin === window.location.origin
            ? `${destination.pathname}${destination.search}${destination.hash}`
            : fallback;
    } catch {
        return fallback;
    }
};

export const destinationFromState = (state: unknown) =>
    safeAuthDestination((state as { from?: unknown } | null)?.from);

export const authCallbackUrl = (destination: string) => {
    const url = new URL(ROUTES.authCallback, window.location.origin);
    url.searchParams.set('next', safeAuthDestination(destination));
    return url.toString();
};

export const passwordRecoveryUrl = () =>
    new URL(ROUTES.updatePassword, window.location.origin).toString();

/** Supabase can report redirect failures in the query (PKCE) or fragment (implicit links). */
export const hasAuthCallbackError = ({ search, hash }: Pick<Location, 'search' | 'hash'>) => {
    const containsError = (params: URLSearchParams) =>
        params.has('error') || params.has('error_code') || params.has('error_description');

    return (
        containsError(new URLSearchParams(search)) ||
        containsError(new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash))
    );
};
