import { useEffect } from 'react';
import { destroyScrollSpine, loadScrollSpine } from '../motion/spine';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

/**
 * Boots the scroll spine for as long as the journey is mounted, and tears it
 * down on the way out so app routes keep native scrolling.
 *
 * Nothing is loaded until after the first paint: the hero is static HTML and
 * must not wait on an animation library to become readable. Under
 * prefers-reduced-motion the spine is never built at all.
 *
 * No snapping. There was, briefly, and it was the wrong tool: every phase now
 * pins and holds while its choreography runs, so the scroll is almost always
 * inside a hold rather than between two of them, and a snap to the nearest
 * section start would haul the page backwards through an animation the visitor
 * was in the middle of. The holds are what stop a phase being skipped; the step
 * and lookahead caps in the spine are what stop a hard flick outrunning them.
 */
export const useCycleScroll = () => {
    const prefersReduced = usePrefersReducedMotion();

    // A refresh starts the cycle at the start of it. The browser restores the
    // scroll position it left, which on this page means being dropped into the
    // middle of a phase with every hold behind it unplayed: the wash never
    // happened, the line is already hung, and the visitor is looking at the
    // end of a sentence. Anchored arrivals are the exception, because a link to
    // a phase is a request to be at that phase.
    useEffect(() => {
        const restoration = window.history.scrollRestoration;
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }

        if (!window.location.hash) {
            window.scrollTo(0, 0);
        }

        return () => {
            if ('scrollRestoration' in window.history) {
                window.history.scrollRestoration = restoration;
            }
        };
    }, []);

    useEffect(() => {
        if (prefersReduced) {
            return undefined;
        }

        let cancelled = false;

        const frame = window.requestAnimationFrame(() => {
            loadScrollSpine().then(() => {
                // The page can unmount while the chunks are still in flight, in
                // which case the spine that just resolved has no owner.
                if (cancelled) {
                    destroyScrollSpine();
                }
            });
        });

        return () => {
            cancelled = true;
            window.cancelAnimationFrame(frame);
            destroyScrollSpine();
        };
    }, [prefersReduced]);
};
