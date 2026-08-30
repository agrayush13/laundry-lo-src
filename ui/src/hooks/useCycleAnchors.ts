import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CYCLE_SECTIONS } from '../config/cycleConfig';
import { softCut } from '../motion/softCut';
import { loadScrollSpine } from '../motion/spine';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

const isSection = (hash: string) => CYCLE_SECTIONS.some((section) => `#${section.id}` === hash);

/** Beyond this many viewports, the journey there is not worth watching. */
const TOO_FAR = 2;

/**
 * Makes in-page links to the phases of the cycle actually go there.
 *
 * Two things break the native behaviour. Lenis owns the scroll position, so the
 * browser's own jump to an anchor is immediately overridden by whatever Lenis
 * thinks the position is. And a link arriving from another route lands on a page
 * whose sections do not exist yet, so there is nothing to jump to by the time
 * the browser looks.
 *
 * Both are handled here: clicks are intercepted and handed to Lenis, and a hash
 * present on arrival is scrolled to once the page has rendered.
 */
export const useCycleAnchors = () => {
    const { hash } = useLocation();
    const navigate = useNavigate();
    const prefersReduced = usePrefersReducedMotion();

    useEffect(() => {
        const scrollTo = (target: string, immediate = false) => {
            const element = document.querySelector<HTMLElement>(target);
            if (!element) {
                return;
            }

            // Asking the spine for a scroll would build it, and under reduced
            // motion the whole point is that it never gets built.
            if (prefersReduced) {
                element.scrollIntoView({ behavior: 'auto' });
                return;
            }

            loadScrollSpine()
                .then(({ gsap, ScrollTrigger, lenis }) => {
                    const page = document.querySelector<HTMLElement>('[data-journey="page"]');
                    const away = Math.abs(element.getBoundingClientRect().top);
                    const near = away < window.innerHeight * TOO_FAR;

                    if (immediate || near || !page) {
                        lenis.scrollTo(element, { immediate });
                        return;
                    }

                    softCut(gsap, page, () => {
                        lenis.scrollTo(element, { immediate: true });
                        ScrollTrigger.update();
                    });
                })
                .catch(() => element.scrollIntoView({ behavior: immediate ? 'auto' : 'smooth' }));
        };

        const onClick = (event: MouseEvent) => {
            const link = (event.target as Element).closest?.('a') as HTMLAnchorElement | null;
            const href = link?.getAttribute('href');
            if (!link || !href) {
                return;
            }

            const modified =
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey;
            if (
                modified ||
                event.defaultPrevented ||
                link.hasAttribute('download') ||
                (link.target && link.target !== '_self')
            ) {
                return;
            }

            // Both shapes point at the same place: "#the-dry" from the journey
            // itself, "/journey#the-dry" from anywhere else in the app.
            const target = href.startsWith('/journey#') ? href.slice('/journey'.length) : href;
            if (!target.startsWith('#') || !isSection(target)) {
                return;
            }

            event.preventDefault();
            scrollTo(target);
            navigate(target, { replace: true });
        };

        document.addEventListener('click', onClick);
        return () => document.removeEventListener('click', onClick);
    }, [navigate, prefersReduced]);

    // A hash the page was opened with, once there is a page to scroll.
    useEffect(() => {
        if (!hash || !isSection(hash)) {
            return undefined;
        }

        let cancelled = false;
        let secondFrame: number | undefined;
        const frame = window.requestAnimationFrame(() => {
            const element = document.querySelector<HTMLElement>(hash);
            if (!element) return;

            if (prefersReduced) {
                element.scrollIntoView({ behavior: 'auto' });
                return;
            }

            void loadScrollSpine()
                .then(({ ScrollTrigger, lenis }) => {
                    if (cancelled) return;
                    // Lazy scenes above the target insert pin spacers. Refresh,
                    // aim, then aim once more after the next layout so a deep
                    // link does not land at the target's old position.
                    ScrollTrigger.refresh();
                    lenis.scrollTo(element, { immediate: true });
                    secondFrame = window.requestAnimationFrame(() => {
                        ScrollTrigger.refresh();
                        lenis.scrollTo(element, { immediate: true });
                    });
                })
                .catch(() => element.scrollIntoView({ behavior: 'auto' }));
        });

        return () => {
            cancelled = true;
            window.cancelAnimationFrame(frame);
            if (secondFrame !== undefined) window.cancelAnimationFrame(secondFrame);
        };
    }, [hash, prefersReduced]);
};
