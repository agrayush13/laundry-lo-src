import { DELIVER } from '../config/cycleConfig';
import { pinScene } from '../motion/pinScene';
import { useSceneMotion } from './useSceneMotion';

/**
 * The shortest hold on the page. The cycle has been running for six sections by
 * now and the footer is underneath this one: long enough to land the delivery,
 * short enough that nobody has to scroll for the links.
 */
const PIN_LENGTH = '+=81%';
const PIN_LENGTH_MOBILE = '+=58%';

/**
 * The delivery. The box eases in, the stack builds a layer at a time with the
 * quick drop of a folded thing being put down, the tag swings once and the peg
 * catches it, and the sign-off resolves.
 *
 * There is no back-to-top rocket: scrolling up through the cycle is the return
 * trip, and it runs this backwards on the way.
 */
export const useDeliver = () =>
    useSceneMotion(DELIVER.meta.id, ({ gsap, ScrollTrigger, section }) => {
        const timeline = gsap.timeline({ paused: true });

        timeline
            .fromTo(
                '[data-deliver="box"]',
                { x: 90, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.55, ease: 'power3.out' }
            )
            .fromTo(
                '[data-deliver="layer"]',
                { y: -34, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.26,
                    stagger: 0.09,
                    ease: 'power2.in',
                },
                0.32
            )
            .fromTo(
                '[data-deliver="tag-line"]',
                { opacity: 0 },
                { opacity: 1, duration: 0.2 },
                0.86
            )
            .fromTo(
                '[data-deliver="tag"]',
                { autoAlpha: 0, y: -22, rotation: -12 },
                {
                    autoAlpha: 1,
                    y: 0,
                    rotation: 0,
                    duration: 0.7,
                    ease: 'elastic.out(1, 0.6)',
                },
                0.9
            )
            .fromTo(
                '[data-deliver="signoff"] > *',
                { y: 16, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.4, stagger: 0.08, ease: 'power2.out' },
                0.2
            );

        pinScene(ScrollTrigger, {
            section,
            length: PIN_LENGTH,
            mobileLength: PIN_LENGTH_MOBILE,
            animation: timeline,
            scrub: 0.8,
        });
    });
