/**
 * One phase of the cycle, held while it plays.
 *
 * Every section works the same way: arriving at it pins it, and the scrolling
 * that follows is what runs its choreography. The page stops moving and the
 * section starts, which is what makes a phase read as a thing that happens
 * rather than a picture that scrolls past. Nothing can be skimmed, because the
 * scroll a section consumes is the scroll its animation costs.
 *
 * The pin lengths are the one place the pacing of the whole page is set: a hold
 * is what a phase costs in scrolling, and because every phase is scrubbed
 * against its own hold, a longer hold is the same choreography played more
 * slowly. There is no separate speed control, and there should not be one.
 *
 * Every hold on the page carries a factor of 1.15 over what it was first built
 * at, which is the page being paced down as a whole. The relative lengths are
 * the deliberate part and each hook explains its own; the factor is uniform, so
 * pacing the page again means moving all six by the same number.
 */

import { CYCLE_SECTIONS } from '../config/cycleConfig';

type ScrollTriggerStatic = typeof import('gsap/ScrollTrigger').ScrollTrigger;
type ScrollTriggerInstance = ReturnType<ScrollTriggerStatic['create']>;

/** Narrow screens get shorter holds: the same story, less thumb. */
const MOBILE = '(max-width: 900px)';

/**
 * Refresh order, which for pinned sections is not optional.
 *
 * Every pin inserts a spacer, which moves everything below it, so a pin can only
 * measure where it starts once every pin above it has been measured. Left to
 * itself ScrollTrigger refreshes in creation order, and the scenes are lazy:
 * whichever one the visitor happens to reach first is built first, so creation
 * order is not document order and never will be. Sections then measure against a
 * page that has since moved, several of them decide they are pinned at once, and
 * three phases of the cycle stack up in one viewport.
 *
 * Priority descends down the page, because the higher the number the sooner
 * ScrollTrigger refreshes it. Taken from the running order rather than passed in,
 * so it cannot drift from it.
 */
const refreshOrder = (section: HTMLElement) => {
    const index = CYCLE_SECTIONS.findIndex(({ id }) => id === section.id);
    return index < 0 ? 0 : CYCLE_SECTIONS.length - index;
};

export interface PinnedScene {
    section: HTMLElement;
    /** Extra scroll the section holds for, as a share of the viewport. */
    length: string;
    mobileLength: string;
    /** Scrubbed against the hold, if the phase is a timeline. */
    animation?: gsap.core.Animation;
    scrub?: number | boolean;
    /** Called on every frame of the hold, and once with the state on arrival. */
    onProgress?: (progress: number) => void;
    /** Called when the section enters or leaves, and once on arrival. */
    onActive?: (active: boolean) => void;
    onRefreshInit?: () => void;
}

/**
 * Pins a section and reports its progress.
 *
 * The initial call to both callbacks is the point. Scenes are lazy, so this can
 * run when the section is already on screen and already part-way through its
 * hold: ScrollTrigger fires onToggle on a crossing, and a crossing that happened
 * before the trigger existed never fires. A scene that waits for it sits frozen
 * until the visitor scrolls past and comes back.
 */
export const pinScene = (
    ScrollTrigger: ScrollTriggerStatic,
    {
        section,
        length,
        mobileLength,
        animation,
        scrub = 0.8,
        onProgress,
        onActive,
        onRefreshInit,
    }: PinnedScene
): ScrollTriggerInstance => {
    const trigger = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: () => (window.matchMedia(MOBILE).matches ? mobileLength : length),
        pin: true,
        scrub,
        animation,
        // The pin has to be taken a frame early or a fast scroll shows the
        // section jumping into its held position.
        anticipatePin: 1,
        refreshPriority: refreshOrder(section),
        invalidateOnRefresh: true,
        onRefreshInit,
        onUpdate: (self) => onProgress?.(self.progress),
        onToggle: (self) => onActive?.(self.isActive),
    });

    onActive?.(trigger.isActive);
    onProgress?.(trigger.progress);

    return trigger;
};

/**
 * The point at which a section's contents are on screen, which is well before
 * the point at which the section is held.
 *
 * A hold begins when the section's top reaches the top of the window, and by
 * then its contents have been sitting there, in full view, for most of a
 * viewport of scrolling. Anything that is supposed to greet the visitor has to
 * start here instead, or it starts late: they watch a still picture come up the
 * screen, and it comes to life at the moment the page stops moving, which reads
 * as the page reacting to the lock rather than to them.
 */
const IN_VIEW = 'top 75%';

/**
 * Runs something once, when a section's contents come into view.
 *
 * The trigger retires after it fires. This is for arrivals, and a section can
 * only be arrived at once; scrolling back up to it is a return.
 */
export const onceInView = (
    ScrollTrigger: ScrollTriggerStatic,
    section: HTMLElement,
    onArrive: () => void
): ScrollTriggerInstance => {
    const trigger = ScrollTrigger.create({
        trigger: section,
        start: IN_VIEW,
        end: 'bottom top',
        once: true,
        onEnter: onArrive,
    });

    // Scenes are lazy, so this can be built with the section already part way up
    // the screen, and a crossing that happened before the trigger existed never
    // fires. Same reason the two below report their state on creation.
    if (trigger.isActive) {
        onArrive();
        trigger.kill();
    }

    return trigger;
};

/**
 * Reports whether a section is anywhere on screen, which is a wider window than
 * its hold: a scene is visible while it is still climbing into view and after
 * its hold has released, and anything ambient in it should be running for all of
 * that. It should be running for none of the rest, because a physics loop
 * ticking behind five other sections is a battery drain and nothing else.
 *
 * Reports the state once on creation, for the same reason the pin does.
 */
export const whileVisible = (
    ScrollTrigger: ScrollTriggerStatic,
    section: HTMLElement,
    onChange: (visible: boolean) => void
): ScrollTriggerInstance => {
    const trigger = ScrollTrigger.create({
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (self) => onChange(self.isActive),
    });

    onChange(trigger.isActive);

    return trigger;
};
