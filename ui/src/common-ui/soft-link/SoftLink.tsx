import React, { useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

/** Out fast, in slower: a fade in that matches the fade out reads as a flicker. */
const LEAVE = 220;

/**
 * The longest the fade will wait for the route it is going to.
 *
 * Long enough that a route already in the browser's cache never shows its
 * loading state, short enough that a cold cache on a bad connection is a beat
 * rather than a stall.
 */
const PATIENCE = 600;

interface SoftLinkProps {
    to: string;
    className?: string;
    /** The route's chunk, so the fade covers the fetch instead of a spinner. */
    preload?: () => Promise<unknown>;
    children: React.ReactNode;
}

/**
 * A link that fades the page out before it changes route, and back in once the
 * new one is standing.
 *
 * For routes that are a place rather than a document. Snapping from the
 * marketing page into the cycle is the cut a hard route change always is, and
 * the cycle opens on a full screen of its own: the same soft cut the cycle uses
 * to move around inside itself is what it should be entered by.
 *
 * Still a real link underneath, so the middle click, the modifier click and the
 * context menu all work; only the plain left click is taken over. Under reduced
 * motion it is an ordinary link and nothing fades.
 *
 * Nothing renders this at the moment. It was built for the header's link into
 * the cycle, and the cycle is no longer advertised there (see `PRIMARY_NAV`), so
 * the only way in is a typed URL, which is a full page load that no in-app
 * transition can dress. It is kept whole rather than deleted because the cycle
 * is coming back as a build of its own, and this is what it should be entered
 * by. Anything else that is a place rather than a page can use it meanwhile.
 */
const SoftLink: React.FC<SoftLinkProps> = ({ to, className, preload, children }) => {
    const navigate = useNavigate();
    const prefersReduced = usePrefersReducedMotion();

    const onClick = useCallback(
        (event: React.MouseEvent<HTMLAnchorElement>) => {
            const modified =
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey;

            if (prefersReduced || modified || event.defaultPrevented) {
                return;
            }

            event.preventDefault();

            const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

            // The fade and the fetch run together, and the navigation waits for
            // whichever finishes last. Sequenced instead, a warm cache would
            // still cost the fade plus a fetch it had already done.
            const faded = wait(LEAVE);
            const ready = preload ? Promise.race([preload(), wait(PATIENCE)]) : Promise.resolve();

            document.body.dataset.leaving = '';

            Promise.all([faded, ready]).then(() => {
                navigate(to);

                // Two frames: one for React to render the new route, one for the
                // browser to lay it out. Coming back sooner fades in on whatever
                // was still on screen.
                window.requestAnimationFrame(() =>
                    window.requestAnimationFrame(() => {
                        delete document.body.dataset.leaving;
                    })
                );
            });
        },
        [navigate, preload, prefersReduced, to]
    );

    return (
        <Link
            className={className}
            to={to}
            onClick={onClick}
        >
            {children}
        </Link>
    );
};

export default SoftLink;
