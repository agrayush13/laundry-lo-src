import { RefObject, useEffect, useState } from 'react';

/** One viewport of warning, so a scene's chunk lands before it is scrolled to. */
const ROOT_MARGIN = '100% 0px';

/**
 * True once a section is close enough to be worth loading, and true forever
 * after: a scene that unmounted on the way past would re-run its arrival when
 * the visitor scrolled back.
 *
 * Without IntersectionObserver the scene mounts immediately. That keeps content
 * parity absolute: no observer, no lazy loading, everything is simply there.
 */
export const useLazyScene = (ref: RefObject<Element | null>) => {
    const [shouldMount, setShouldMount] = useState(
        () => typeof IntersectionObserver === 'undefined'
    );

    useEffect(() => {
        const element = ref.current;
        if (shouldMount || !element) {
            return undefined;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    setShouldMount(true);
                }
            },
            { rootMargin: ROOT_MARGIN }
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, [ref, shouldMount]);

    return shouldMount;
};
