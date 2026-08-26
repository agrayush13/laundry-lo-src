import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Every section renders complete and static when this is true; choreography and
 * ambient motion simply never start. It is a live subscription rather than a
 * one-off read because the setting can change mid-visit.
 */
export const usePrefersReducedMotion = () => {
    const [prefersReduced, setPrefersReduced] = useState(
        () => window.matchMedia?.(QUERY).matches ?? false
    );

    useEffect(() => {
        const query = window.matchMedia?.(QUERY);
        if (!query) {
            return undefined;
        }

        const onChange = (event: MediaQueryListEvent) => setPrefersReduced(event.matches);
        query.addEventListener('change', onChange);
        return () => query.removeEventListener('change', onChange);
    }, []);

    return prefersReduced;
};
