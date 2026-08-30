import React from 'react';
import { API_COPY } from '../../config/apiConfig';
import { AsyncState } from '../../hooks/useAsync';
import DrumMark from '../drum-mark/DrumMark';
import styles from './asyncBoundary.module.scss';

interface AsyncBoundaryProps<T> {
    state: AsyncState<T>;
    /** Rendered only once there is data; nothing here handles a null. */
    children: (data: T) => React.ReactNode;
    /** Loaded, but with nothing in it - a filter that matched no partners. */
    isEmpty?: (data: T) => boolean;
    empty?: React.ReactNode;
    /** Announced while loading, e.g. "Loading laundries". */
    label?: string;
}

/**
 * The three states of a request, in one place, so no screen can quietly skip
 * one. A failure always offers the way out of it: the same request again.
 */
const AsyncBoundary = <T,>({
    state,
    children,
    isEmpty,
    empty,
    label = API_COPY.loading,
}: AsyncBoundaryProps<T>) => {
    if (state.error) {
        return (
            <div
                className={styles.asyncError}
                role="alert"
            >
                <p className={styles.asyncErrorMessage}>{state.error.message}</p>
                <button
                    type="button"
                    className="button button--primary"
                    onClick={state.reload}
                >
                    {API_COPY.retry}
                </button>
            </div>
        );
    }

    if (state.isLoading || !state.data) {
        return (
            <div
                className={styles.asyncLoading}
                role="status"
                aria-label={label}
            >
                <div className={styles.asyncDrum}>
                    <DrumMark level={0.45} />
                </div>
            </div>
        );
    }

    if (isEmpty?.(state.data)) {
        return <>{empty}</>;
    }

    return <>{children(state.data)}</>;
};

export default AsyncBoundary;
