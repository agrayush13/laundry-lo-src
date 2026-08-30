import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../services/apiClient';

export interface AsyncState<T> {
    data: T | null;
    isLoading: boolean;
    error: ApiError | null;
    /** Re-runs the request; what a Try again button is wired to. */
    reload: () => void;
}

const asApiError = (error: unknown) =>
    error instanceof ApiError
        ? error
        : new ApiError('INTERNAL_ERROR', 'Something went wrong. Try again in a moment.');

/**
 * Runs an API call and reports the three states every screen owes the customer:
 * loading, failed, and loaded. `deps` are the values the request is built from -
 * a change to any of them starts a new request and abandons the one in flight,
 * so a fast sequence of filter changes cannot let an early response land last.
 *
 * Data is cleared while reloading rather than held: showing the previous
 * partners under new filters says something untrue for as long as it takes the
 * network to answer.
 */
export const useAsync = <T>(
    load: (signal: AbortSignal) => Promise<T>,
    deps: readonly unknown[]
): AsyncState<T> => {
    const [state, setState] = useState<Omit<AsyncState<T>, 'reload'>>({
        data: null,
        isLoading: true,
        error: null,
    });
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        setState({ data: null, isLoading: true, error: null });

        load(controller.signal).then(
            (data) => {
                if (!controller.signal.aborted) {
                    setState({ data, isLoading: false, error: null });
                }
            },
            (error: unknown) => {
                // An abort is this effect being replaced, not a failure to show.
                if (!controller.signal.aborted) {
                    setState({ data: null, isLoading: false, error: asApiError(error) });
                }
            }
        );

        return () => controller.abort();
        // `load` is rebuilt every render, so the request's real inputs are the
        // caller's `deps`; including `load` here would re-fetch forever.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, attempt]);

    return { ...state, reload: useCallback(() => setAttempt((count) => count + 1), []) };
};
