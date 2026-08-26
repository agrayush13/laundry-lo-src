import { FOLD } from '../config/cycleConfig';
import { pinScene } from '../motion/pinScene';
import { CREASE, PRESS } from '../pages/journey/scenes/PressShirt';
import { useSceneMotion } from './useSceneMotion';

/** How long the fold holds the page. Three folds need room to read as three. */
const PIN_LENGTH = '+=301%';
const PIN_LENGTH_MOBILE = '+=208%';

/**
 * Creases, in the shirt's own viewBox coordinates. A panel turns over on its
 * crease: the left sleeve spans 30 to 330 and mirroring it about 330 lands it
 * exactly on the chest column, 330 to 630, which is what makes this read as
 * folding rather than as shrinking.
 */
const PIVOT = {
    left: `${CREASE.left} ${CREASE.bottom}`,
    right: `${CREASE.right} ${CREASE.bottom}`,
    lower: `480 ${CREASE.bottom}`,
};

/**
 * How long one crossing takes, and the beat between two of them.
 *
 * The iron carries 1220 units across a 960-unit box, so a crossing at 0.6 put
 * the whole width of the screen behind it in a quarter of a viewport of
 * scrolling, which is a shove rather than a press. Ironing is a slow, deliberate
 * gesture and the section is the one place on the page that should look
 * unhurried. The hold grew with it, so the folds after it did not lose the room
 * they need.
 */
const CROSSING = 1;
const LANE_CHANGE = 0.06;

/**
 * Where the folding starts, once the press has finished and had its beat.
 *
 * Everything after the press is placed against this rather than written out as
 * absolute times, so lengthening a crossing moves the folds, the settle and the
 * reveal along with it instead of leaving the iron still crossing while the
 * sleeves come in.
 */
const FOLDING = 3.6;

/**
 * One puff of steam: up off the cloth, and thinner as it goes.
 *
 * On its own loop rather than on the scrubbed timeline, which is the only way
 * steam can behave like steam here. Scrubbed, it played backwards when the
 * visitor scrolled up, and a wisp shrinking back down into the plate it came
 * out of is the one thing that reads as an animation rather than as an iron.
 * The scrubbed timeline still decides whether there is steam at all; this only
 * decides what it does while there is.
 */
const PUFF = { rise: 0.42, drift: 0.78, apart: 0.38 };

/**
 * The press and the fold, run by the scroll.
 *
 * Arriving pins the section: the iron crosses the shirt three times and each
 * crease goes out under the plate passing over it, then the panels turn over on
 * their own creases, left in, right over, bottom up. Scrolling back up unfolds
 * it, one crease at a time, and irons the wrinkles back in.
 *
 * Three sequential folds need more hold than any other phase, which is why this
 * one is the longest on the page: scrubbed into a shorter run they collapse into
 * each other and read as the shirt shrinking rather than folding.
 */
export const useFold = () =>
    useSceneMotion(FOLD.meta.id, ({ gsap, ScrollTrigger, section }) => {
        const part = (name: string) => `[data-fold="${name}"]`;
        const timeline = gsap.timeline({ paused: true });

        const fold = (panel: string, face: string, axis: 'scaleX' | 'scaleY', at: number) =>
            timeline
                .to(
                    [part(panel)],
                    {
                        [axis]: -1,
                        svgOrigin: PIVOT[panel.replace('panel-', '') as keyof typeof PIVOT],
                        duration: 0.42,
                        ease: 'power2.inOut',
                    },
                    at
                )
                // The face goes as the panel passes edge-on, and its back
                // arrives in the same instant.
                .to(part(face), { opacity: 0, duration: 0.01 }, at + 0.2)
                .to(`${part(panel)} rect`, { opacity: 1, duration: 0.01 }, at + 0.21)
                // The small press that lands a crease, along the axis the panel
                // just turned over on.
                //
                // It has to keep the sign of the fold. Pressing on scaleY was
                // harmless for the two panels that fold sideways and undid the
                // one that folds upward: the bottom panel mirrored to -1 and
                // this put it straight back to 1, so it unfolded itself a third
                // of a second later and sat there as a second empty rectangle
                // under the finished shirt.
                .to(part(panel), { [axis]: -0.985, duration: 0.08 }, at + 0.42)
                .to(part(panel), { [axis]: -1, duration: 0.12 }, at + 0.5);

        // Steam, puffing away on its own clock for as long as the section is
        // held. Staggered, because four wisps leaving the plate in unison is a
        // sprinkler.
        const puffs = gsap.utils.toArray<SVGElement>(part('wisp')).map((wisp, index) =>
            gsap
                .timeline({ repeat: -1, delay: index * PUFF.apart })
                .fromTo(
                    wisp,
                    { y: 8, opacity: 0 },
                    { y: -4, opacity: 1, duration: PUFF.rise, ease: 'sine.out' }
                )
                .to(wisp, { y: -26, opacity: 0, duration: PUFF.drift, ease: 'sine.in' })
        );

        timeline
            .set(part('iron'), { x: PRESS.enters, y: PRESS.bands[0].runsAt, opacity: 0 })
            .to(part('iron'), { opacity: 1, duration: 0.2 }, 0)
            .to(part('steam'), { opacity: 0.75, duration: 0.25 }, 0.1);

        // Three crossings, turning round at each end, and a crease goes out
        // under the plate that is passing over it rather than every crease
        // fading together on a timer of its own. The erase is tied to the
        // iron's position, not merely started near it: the crossing runs at a
        // constant speed, so the share of it at which the iron meets the near
        // end of a crease and the share at which it leaves the far end are
        // arithmetic, and the crease is rubbed out over exactly that stretch.
        // Both ends of the shirt are off the box, so the turn is never seen.
        let at = 0.2;

        PRESS.bands.forEach((band, index) => {
            const rightward = index % 2 === 0;
            const from = rightward ? PRESS.enters : PRESS.leaves;
            const to = rightward ? PRESS.leaves : PRESS.enters;
            const share = (x: number) => (x - from) / (to - from);
            const meets = share(rightward ? PRESS.span.left : PRESS.span.right);
            const leaves = share(rightward ? PRESS.span.right : PRESS.span.left);

            timeline
                .set(part('iron'), { y: band.runsAt }, at)
                // A plain tween, not a fromTo: every crossing starts where the
                // last one finished, so there is nothing to state, and a
                // fromTo would render its start value the moment it is built
                // and put the iron at the far end of the shirt at time zero.
                .to(part('iron'), { x: to, duration: CROSSING, ease: 'none' }, at)
                // Rubbed out from the end the iron reaches first, which is why
                // the offset takes the sign of the direction: the dash pattern
                // runs along the path, so pushing it one way eats the crease
                // from its start and the other way from its finish.
                .to(
                    `[data-fold="wrinkle"][data-band="${index}"]`,
                    {
                        attr: { 'stroke-dashoffset': rightward ? -1 : 1 },
                        duration: (leaves - meets) * CROSSING,
                        ease: 'none',
                    },
                    at + meets * CROSSING
                );

            at += CROSSING + LANE_CHANGE;
        });

        // The last crossing carries the iron off the right hand edge, so both
        // of these play out of sight. They are here for the way back up.
        const pressed = at - LANE_CHANGE;
        timeline
            .to(part('steam'), { opacity: 0, duration: 0.26 }, pressed)
            .to(part('iron'), { opacity: 0, duration: 0.22 }, pressed + 0.04);

        // Left sleeve in, right sleeve over, then the whole lower half up. The
        // last one has to wait for the first two: it folds through them, so it
        // cannot start until they have landed.
        fold('panel-left', 'face-left', 'scaleX', FOLDING);
        fold('panel-right', 'face-right', 'scaleX', FOLDING + 0.32);
        fold('lower', 'face-bottom', 'scaleY', FOLDING + 0.96);

        timeline
            // Settling into the middle of the frame as the last crease lands.
            // The folded parcel sits at 100 to 320 of a 620 tall box, so a
            // hundred down centres it; measured off the geometry rather than
            // nudged until it looked right.
            .to(
                part('shirt'),
                {
                    y: (620 - (CREASE.bottom - 100)) / 2 - 100,
                    duration: 0.6,
                    ease: 'power2.inOut',
                },
                FOLDING + 1.1
            )
            .to(part('creases'), { opacity: 0.16, duration: 0.3 }, FOLDING + 1.6)
            .fromTo(
                part('chest'),
                { opacity: 0, scale: 0.94, svgOrigin: '480 210' },
                { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.6)' },
                FOLDING + 1.62
            )
            // The tag is inert until there is a shirt to hang it on, and
            // autoAlpha keeps it out of the tab order until then.
            .fromTo(
                '[data-fold="tag"]',
                { autoAlpha: 0, y: -26, rotation: -14 },
                {
                    autoAlpha: 1,
                    y: 0,
                    rotation: 0,
                    duration: 0.55,
                    ease: 'elastic.out(1, 0.55)',
                },
                FOLDING + 1.9
            );

        pinScene(ScrollTrigger, {
            section,
            length: PIN_LENGTH,
            mobileLength: PIN_LENGTH_MOBILE,
            animation: timeline,
            scrub: 0.7,
            // The kettle is off while the page is anywhere else.
            onActive: (active) => puffs.forEach((puff) => (active ? puff.resume() : puff.pause())),
        });
    });
