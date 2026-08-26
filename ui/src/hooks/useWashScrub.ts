import { RefObject, useEffect } from 'react';
import { CYCLE_SECTIONS } from '../config/cycleConfig';
import { loadScrollSpine } from '../motion/spine';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

/**
 * How much scrolling the pinned wash consumes, as a share of the viewport.
 *
 * Two factors, neither of them set by feel. The score runs 11.7 seconds where it
 * used to run 10.4, so these carry the same 1.125 and a beat that was not slowed
 * down does not speed up: slowing the pour inside a fixed hold would have taken
 * the scroll for it from everything else. On top of that they carry the 1.15
 * every hold on the page carries, which is the page being paced down as a whole.
 */
const PIN_LENGTH = '+=259%';
const PIN_LENGTH_MOBILE = '+=182%';
const MOBILE = '(max-width: 900px)';

/**
 * Pins the hero and runs the wash against the scroll: the door opens, the
 * garments and then the letters fly into the drum, the line closes up behind
 * them, the door shuts, detergent pours in two stages, the clean headline
 * arrives while the water is still rising, and the drum spins up.
 *
 * Position-scrubbed and fully reversible, which is what makes scrolling back up
 * put the stains back rather than replay anything.
 */
export const useWashScrub = (sectionRef: RefObject<HTMLElement | null>) => {
    const prefersReduced = usePrefersReducedMotion();

    useEffect(() => {
        const section = sectionRef.current;
        if (prefersReduced || !section) {
            return undefined;
        }

        let cancelled = false;
        let context: gsap.Context | null = null;

        // The score loads with the spine: neither belongs in the bundle that has
        // to paint the hero.
        Promise.all([loadScrollSpine(), import('../motion/washTimeline')]).then(
            ([{ gsap, ScrollTrigger }, { buildWashTimeline }]) => {
                if (cancelled) {
                    return;
                }

                context = gsap.context(() => {
                    const wash = buildWashTimeline(gsap, section);

                    ScrollTrigger.create({
                        trigger: section,
                        start: 'top top',
                        end: () =>
                            window.matchMedia(MOBILE).matches ? PIN_LENGTH_MOBILE : PIN_LENGTH,
                        pin: true,
                        scrub: 0.8,
                        animation: wash.timeline,
                        invalidateOnRefresh: true,

                        // First section on the page, so it measures first. Every
                        // pin below it starts where this one's spacer ends, and
                        // a pin that measures out of order sends the sections
                        // it displaced on top of each other. See
                        // motion/pinScene.ts.
                        refreshPriority: CYCLE_SECTIONS.length,

                        // Measure from the rest state. Rectangles read mid-flight
                        // would send every letter to the wrong place.
                        onRefreshInit: () => {
                            wash.timeline.progress(0);
                            wash.invalidate();
                        },

                        // Compositor hints belong to the pin, not to the page:
                        // thirty promoted layers are worth it while the wash runs
                        // and a waste of memory for the rest of the visit.
                        onToggle: ({ isActive }) =>
                            gsap.set(section.querySelectorAll('[data-wash="letter"]'), {
                                willChange: isActive ? 'transform' : 'auto',
                            }),
                    });
                }, section);
            }
        );

        return () => {
            cancelled = true;
            context?.revert();
        };
    }, [prefersReduced, sectionRef]);
};
