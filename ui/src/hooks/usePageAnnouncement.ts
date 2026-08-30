import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { documentTitleFor, pageNameFor } from '../config/navigationConfig';

/**
 * Makes a client-side navigation as legible as a page load.
 *
 * Three things happen on a real navigation that a router does not do for free:
 * the title changes, focus returns to the top of the new document, and assistive
 * technology is told. Without them a route change is completely silent - the
 * heading is different but nothing says so, and focus is still on the link that
 * was activated, inside a header that did not move.
 *
 * The returned name goes into a live region rather than being announced by the
 * focus move, because focusing a container announces the container. Focus is
 * still moved, for the keyboard user who would otherwise tab through the whole
 * header again to reach the content they just asked for.
 */
export const usePageAnnouncement = (main: React.RefObject<HTMLElement>) => {
    const { pathname, hash } = useLocation();
    const isFirstRender = useRef(true);

    useEffect(() => {
        document.title = documentTitleFor(pathname);
    }, [pathname]);

    useEffect(() => {
        // The first render is a real page load: the browser has already put
        // focus where it belongs, and moving it would fight that.
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        // An in-page link is going somewhere specific; hijacking focus back to
        // the top would undo exactly what the visitor asked for.
        if (hash) {
            return;
        }

        main.current?.focus({ preventScroll: true });
    }, [pathname, hash, main]);

    return pageNameFor(pathname);
};
