import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Resets scroll position on navigation, as a new page load would, unless the
 * location names a section.
 *
 * An in-page link arriving from another route is the case that needs handling.
 * The browser looks for the anchor the moment the document loads, which is
 * before React has rendered the route that contains it, finds nothing, and gives
 * up; this hook then scrolled to the top, so "How It Works" from anywhere in the
 * app landed on the top of the homepage. Looking again on the next frame is all
 * it takes, because by then the section exists.
 */
export const useScrollToTop = () => {
    const { pathname, hash } = useLocation();

    useEffect(() => {
        if (!hash) {
            window.scrollTo(0, 0);
            return undefined;
        }

        const frame = window.requestAnimationFrame(() => {
            document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({
                behavior: 'smooth',
            });
        });

        return () => window.cancelAnimationFrame(frame);
    }, [pathname, hash]);
};
