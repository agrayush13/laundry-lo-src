/**
 * The journey's motion spine: Lenis for the scroll, GSAP with ScrollTrigger for
 * the choreography. Both are loaded on demand, after first paint, so the hero
 * paints without them and no other route ever pays for them.
 *
 * The module owns a single instance. Sections ask for the spine when they mount
 * and never construct their own, because two Lenis instances fight over the
 * scroll and two ScrollTrigger registries drift apart.
 */

type Gsap = typeof import('gsap').gsap;
type ScrollTriggerStatic = typeof import('gsap/ScrollTrigger').ScrollTrigger;
type LenisInstance = InstanceType<typeof import('lenis').default>;

export interface ScrollSpine {
    gsap: Gsap;
    ScrollTrigger: ScrollTriggerStatic;
    lenis: LenisInstance;
}

/**
 * How far one wheel or touch event may move the page, and how far the scroll may
 * ever run ahead of where it currently is.
 *
 * A hard flick is a burst of large events, and smooth scrolling will happily
 * chase a target several screens away: the page arrives without ever having
 * travelled through what was in between, so a whole phase of the cycle can go
 * past unseen. Capping the step keeps one gesture proportionate, and capping the
 * lookahead means the page always covers the ground rather than jumping it. The
 * scroll stays as fast as the visitor wants; it just cannot skip.
 *
 * This is the floor under the holds, not a substitute for them. Every phase pins
 * and consumes real scroll while it plays, which is what makes the cycle
 * unskippable; these two keep a violent gesture from outrunning that.
 *
 * The step cap is deliberately loose. It was half this once, which trimmed
 * ordinary trackpad momentum along with the violence and turned a long page into
 * wading; the lookahead is the cap that does the real work, because it limits
 * how far ahead of the page the scroll may be rather than how hard the visitor
 * is allowed to push.
 *
 * The lookahead is also, in effect, a speed limit. Lenis closes the gap between
 * where the page is and where the scroll wants it exponentially, at a rate its
 * lerp sets, so the fastest the page can ever move is that rate times the widest
 * the gap is allowed to be: at the default lerp, 0.55 of a viewport caps it near
 * three and a third viewports a second. It was 0.9, which allowed nearly five
 * and a half, and a phase crossed at that speed is a phase nobody saw. Ordinary
 * scrolling never opens a gap this wide and is untouched.
 */
const MAX_STEP = 240;
const MAX_LOOKAHEAD = 0.55;

let pending: Promise<ScrollSpine> | null = null;
let spine: ScrollSpine | null = null;

const build = async (): Promise<ScrollSpine> => {
    // Lenis ships the stylesheet it needs to keep the document scrollable while
    // it drives the scroll; it rides in this chunk rather than the page's CSS.
    const [{ gsap }, { ScrollTrigger }, { default: Lenis }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
        import('lenis'),
        import('lenis/dist/lenis.css'),
    ]);

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
        autoRaf: false,
        virtualScroll: (data) => {
            data.deltaY = Math.max(-MAX_STEP, Math.min(MAX_STEP, data.deltaY));
            return true;
        },
    });

    // Lenis drives the frame, so ScrollTrigger has to be told when the position
    // changed and GSAP's ticker has to advance Lenis. Wiring it the other way
    // round leaves the triggers a frame behind the content.
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
        // Reel the target back in before the frame is drawn, so momentum from a
        // hard scroll turns into a longer journey rather than a jump.
        const lookahead = window.innerHeight * MAX_LOOKAHEAD;
        const overshoot = lenis.targetScroll - lenis.animatedScroll;

        if (Math.abs(overshoot) > lookahead) {
            lenis.targetScroll = lenis.animatedScroll + Math.sign(overshoot) * lookahead;
        }

        lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    spine = { gsap, ScrollTrigger, lenis };
    return spine;
};

/** Resolves with the shared spine, building it on the first call. */
export const loadScrollSpine = () => {
    pending = pending ?? build();
    return pending;
};

/** Tears the spine down when the homepage unmounts, so app routes scroll natively. */
export const destroyScrollSpine = () => {
    if (!spine) {
        pending = null;
        return;
    }

    spine.ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    spine.gsap.ticker.lagSmoothing(500, 33);
    spine.lenis.destroy();
    spine = null;
    pending = null;
};
