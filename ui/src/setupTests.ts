import '@testing-library/jest-dom';
import { installApiFixture } from './__mocks__/apiFixtures';

// happy-dom has no layout engine, so its IntersectionObserver never fires and
// anything gated on visibility would stay unmounted for the whole suite. Report
// everything as visible instead: what the journey lazy-loads is exactly what a
// visitor scrolling the page would reach.
class ImmediateIntersectionObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = '';
    readonly thresholds = [];

    constructor(private readonly callback: IntersectionObserverCallback) {}

    observe(target: Element) {
        this.callback([{ isIntersecting: true, target } as IntersectionObserverEntry], this);
    }

    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
        return [];
    }
}

window.IntersectionObserver = ImmediateIntersectionObserver;

// The journey's motion spine measures a laid-out document, and happy-dom has
// no layout: GSAP walks straight into SVG APIs it does not implement. The spine
// never boots here, so the tests see the static rest state, which is also what
// prefers-reduced-motion and a failed chunk fetch produce. Motion is verified in
// a browser.
vi.mock('./motion/spine', () => ({
    loadScrollSpine: () => new Promise(() => {}),
    destroyScrollSpine: () => {},
}));

// Cart, session and theme all persist to localStorage, so every test needs to
// start from a clean slate or state leaks between them.
beforeEach(() => {
    window.localStorage.clear();

    // Partners, catalogues and slots come from the API now. The fixture serves
    // the same demo set as the database seed, so the journeys these tests drive
    // stay real without needing a server running.
    installApiFixture();
});

afterEach(() => {
    vi.unstubAllGlobals();
});
