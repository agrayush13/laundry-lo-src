import { useCallback, useEffect, useRef, useState } from 'react';
import { softCut } from '../motion/softCut';
import { loadScrollSpine } from '../motion/spine';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

/**
 * How fast the tour scrolls, in viewports a second.
 *
 * Every phase is pinned and its choreography is scrubbed against the scroll, so
 * scroll speed is playback speed and this one number is the pace of the whole
 * film. Expressed in viewports rather than pixels because the holds are: a phase
 * that holds for two viewports takes twice this to play whatever size the window
 * is, which is what keeps the pace the same on a laptop and a monitor.
 */
const PACE = 0.36;

/**
 * How long the page has to have been at the bottom before the tour calls it
 * finished.
 *
 * Long enough to cover a scene whose chunk is still in flight, and it doubles as
 * a beat on the last phase so the tour does not report itself done on the frame
 * the delivery arrives.
 */
const SETTLE = 0.5;

/** Keys that mean "I will take it from here". */
const TAKES_OVER = new Set([
    'ArrowUp',
    'ArrowDown',
    'PageUp',
    'PageDown',
    'Home',
    'End',
    ' ',
    'Escape',
]);

/**
 * Plays the cycle, so the visitor can watch it instead of driving it.
 *
 * This replaced a link that jumped to one phase in the middle. The question the
 * link answered is "how does this work", and the answer is the whole cycle in
 * order, not the fourth sixth of it: landing somebody at the dry is landing them
 * in the middle of a sentence with the wash, the rinse and the spin already
 * behind them and no sign that they were ever there.
 *
 * The tour always starts from the top, behind a cut, because a tour that begins
 * wherever the visitor happened to stop is not a tour of anything.
 *
 * It gives way immediately. A wheel, a swipe or a scrolling key hands the page
 * straight back, at the position it had reached, because a page that keeps
 * scrolling itself while somebody is trying to scroll it is broken however good
 * the intention was. Not offered at all under reduced motion, where a page that
 * moves on its own is the exact thing being asked for less of.
 */
export const useCycleTour = () => {
    const [playing, setPlaying] = useState(false);
    // Held in a ref so the listeners set up by one run can always find the way
    // to end that run, whatever has re-rendered since.
    const halt = useRef<() => void>(() => {});
    const prefersReduced = usePrefersReducedMotion();

    const stop = useCallback(() => halt.current(), []);

    const play = useCallback(() => {
        // Never two tours at once, and a no-op if none is running.
        halt.current();
        setPlaying(true);

        loadScrollSpine()
            .then(({ gsap, ScrollTrigger, lenis }) => {
                const onKey = (event: KeyboardEvent) => {
                    if (TAKES_OVER.has(event.key)) {
                        stop();
                    }
                };

                // Lenis emits this for taps as well as scrolls, and a tap is
                // not somebody asking to take the wheel. Only a real gesture
                // counts.
                const onGesture = ({ deltaX, deltaY }: { deltaX: number; deltaY: number }) => {
                    if (deltaX !== 0 || deltaY !== 0) {
                        stop();
                    }
                };

                let aimedAt = -1;
                let atEnd = 0;

                /**
                 * Sets the page rolling towards the bottom at the pace.
                 *
                 * Through `scrollTo`, because that is the only thing that moves
                 * a Lenis page: `targetScroll` is bookkeeping, and its
                 * animation returns on the first line unless a `scrollTo`
                 * started it. Writing the target directly moves a number nobody
                 * reads, which is exactly as much as the tour did at first.
                 *
                 * Linear, and paced in viewports rather than pixels, because
                 * every phase is scrubbed against the scroll: scroll speed is
                 * playback speed, and a hold measured in viewports should take
                 * the same time to play whatever the size of the window.
                 */
                const aim = () => {
                    aimedAt = lenis.limit;
                    const distance = aimedAt - lenis.animatedScroll;

                    if (distance > 1) {
                        lenis.scrollTo(aimedAt, {
                            duration: distance / (window.innerHeight * PACE),
                            easing: (progress) => progress,
                        });
                    }
                };

                const roll = (_time: number, delta: number) => {
                    const seconds = Math.min(delta / 1000, 1 / 30);

                    // The bottom of the page is not where it was when the tour
                    // started. The scenes are lazy, and each one that mounts
                    // pins its section, which inserts a spacer and makes the
                    // document taller: aimed once from the top, the tour would
                    // stop about a fifth of the way down. Re-aimed whenever the
                    // page grows, which is a handful of times over the whole
                    // journey, and always at the same pace, so the speed does
                    // not change when it happens.
                    if (lenis.limit !== aimedAt) {
                        aim();
                    }

                    atEnd = lenis.animatedScroll >= lenis.limit - 1 ? atEnd + seconds : 0;

                    if (atEnd > SETTLE) {
                        end();
                    }
                };

                const end = () => {
                    halt.current = () => {};
                    gsap.ticker.remove(roll);
                    lenis.off('virtual-scroll', onGesture);
                    window.removeEventListener('keydown', onKey);

                    // Stopping and starting again is how Lenis is asked to
                    // drop a scroll it is part way through: it resets the
                    // target to where the page actually is, so the page ends
                    // here rather than coasting on to the bottom. It matters
                    // most for the gesture that interrupted us: this runs
                    // before Lenis acts on it, so the nudge is measured from
                    // the position the visitor can see.
                    lenis.stop();
                    lenis.start();
                    setPlaying(false);
                };

                halt.current = end;
                lenis.on('virtual-scroll', onGesture);
                window.addEventListener('keydown', onKey);

                const start = () => {
                    aim();
                    gsap.ticker.add(roll);
                };

                const page = document.querySelector<HTMLElement>('[data-journey="page"]');
                if (!page || lenis.animatedScroll < 2) {
                    start();
                    return;
                }

                softCut(gsap, page, () => {
                    lenis.scrollTo(0, { immediate: true });
                    ScrollTrigger.update();
                    start();
                });
            })
            .catch(() => setPlaying(false));
    }, [stop]);

    // A tour outlives nothing: leaving the page ends it.
    useEffect(() => () => halt.current(), []);

    return { available: !prefersReduced, playing, play, stop };
};
