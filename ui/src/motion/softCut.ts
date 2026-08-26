/**
 * A cut, softened: the page fades out, moves while nobody can see it, and fades
 * back in where it now is.
 *
 * This is what a long jump inside the cycle has to look like. Scrolled smoothly,
 * a dozen screens is every phase scrubbing backwards through its own
 * choreography at a speed nobody can read, ending on a page that appears to have
 * been yanked. Cut without the fade and the page simply teleports. What the
 * visitor asked for is the destination, not the trip.
 *
 * The cut lands on a phase at rest, which is what arriving at one looks like
 * anyway: the choreography is scrubbed to the scroll, so being put at the start
 * of a section is being at the start of it.
 */

type Gsap = typeof import('gsap').gsap;

/** Quicker to leave than to arrive: a fade in that matches the fade out reads as a flicker. */
const OUT = 0.22;
const IN = 0.42;

export const softCut = (gsap: Gsap, page: HTMLElement, move: () => void) =>
    gsap
        .timeline()
        .to(page, { opacity: 0, duration: OUT, ease: 'power1.in' })
        .add(move)
        .to(page, { opacity: 1, duration: IN, ease: 'power2.out' });
