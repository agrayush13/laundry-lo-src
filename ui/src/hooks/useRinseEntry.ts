import { RINSE } from '../config/cycleConfig';
import { pinScene } from '../motion/pinScene';
import { useSceneMotion } from './useSceneMotion';

/** How long the rinse holds the page while it fills and clears. */
const PIN_LENGTH = '+=121%';
const PIN_LENGTH_MOBILE = '+=86%';

/**
 * The rinse arrives in three beats, and the scroll is what runs them.
 *
 * The curtain sweeps down from the seam where the hero ends, drips, and retreats
 * to a hairline. Bubbles rise once and pop. The cards break the surface. Then the
 * water line thins and lets go as the spin takes over below it.
 *
 * Scrubbed against the hold rather than played on arrival, so scrolling back up
 * puts the water back rather than replaying it, and so the section cannot be
 * passed faster than it can be read.
 */
export const useRinseEntry = () =>
    useSceneMotion(RINSE.meta.id, ({ gsap, ScrollTrigger, section }) => {
        const timeline = gsap.timeline({ paused: true });

        timeline
            .fromTo(
                '[data-rinse="curtain"]',
                { y: -210 },
                { y: 0, duration: 0.5, ease: 'power2.out' }
            )
            .to('[data-rinse="curtain"]', { y: -196, duration: 0.7, ease: 'power2.inOut' }, 0.75)

            // The drips leave the curtain as it climbs back up.
            .fromTo(
                '[data-rinse="droplets"] ellipse',
                { opacity: 0, y: 0 },
                {
                    opacity: 1,
                    y: () => gsap.utils.random(60, 150, 1),
                    duration: 0.6,
                    stagger: { each: 0.07, from: 'random' },
                    ease: 'power1.in',
                },
                0.72
            )
            .to(
                '[data-rinse="droplets"] ellipse',
                { opacity: 0, duration: 0.25, stagger: 0.06 },
                1.05
            )

            .to('[data-rinse="line"]', { opacity: 1, duration: 0.4 }, 1.1)

            // Bubbles rise once and pop at the water line.
            .fromTo(
                '[data-rinse="bubble"]',
                { opacity: 0, y: 0, scale: 1 },
                {
                    opacity: 0.8,
                    y: () => -gsap.utils.random(180, 300, 1),
                    duration: 1.1,
                    stagger: 0.16,
                    ease: 'power1.out',
                },
                0.5
            )
            .to(
                '[data-rinse="bubble"]',
                { opacity: 0, scale: 1.5, duration: 0.22, stagger: 0.16 },
                1.5
            )

            // Lifted out of the water and breaking the surface: each card
            // rises while a mask uncovers it from the bottom up.
            .fromTo(
                '[data-rinse="card"]',
                { y: 36, clipPath: 'inset(0 0 100% 0)' },
                {
                    y: 0,
                    clipPath: 'inset(0 0 0% 0)',
                    duration: 0.55,
                    stagger: 0.075,
                    ease: 'power2.out',
                },
                1.25
            )

            // The seam into the spin: the still water line thins and lets go as
            // the drum starts up below it. The droplets are left alone, because
            // two tweens writing the same opacity is a coin toss.
            .to(
                '[data-rinse="line"]',
                { opacity: 0.2, scaleY: 0.4, transformOrigin: 'center', duration: 0.5 },
                2.1
            );

        pinScene(ScrollTrigger, {
            section,
            length: PIN_LENGTH,
            mobileLength: PIN_LENGTH_MOBILE,
            animation: timeline,
            scrub: 0.8,
            // Measure from the rest state: rectangles read mid-flight would
            // send the drips and the bubbles to the wrong places.
            onRefreshInit: () => timeline.progress(0).invalidate(),
        });
    });
