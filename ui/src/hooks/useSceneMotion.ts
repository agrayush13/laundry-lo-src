import { useEffect } from 'react';
import { ScrollSpine, loadScrollSpine } from '../motion/spine';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

export interface SceneStage extends ScrollSpine {
    /** The full-viewport section, which is what pins and triggers hang off. */
    section: HTMLElement;
}

/**
 * Wires one section's choreography to the scroll spine.
 *
 * Called from inside the scene it animates, never from the page: the scenes are
 * lazy, so a hook that ran when the page mounted would go looking for markup
 * that does not exist yet, find nothing, and silently animate an empty
 * selection. Mounting the hook with the scene means the two arrive together.
 *
 * The section itself is found by id rather than handed down as a ref, because it
 * belongs to the page and the scene is several levels inside it.
 */
export const useSceneMotion = <T>(
    sectionId: string,
    build: (stage: SceneStage, extra: T) => (() => void) | void,
    preload?: () => Promise<T>
) => {
    const prefersReduced = usePrefersReducedMotion();

    useEffect(() => {
        const section = document.getElementById(sectionId);
        if (prefersReduced || !section) {
            return undefined;
        }

        let cancelled = false;
        let context: gsap.Context | null = null;
        let teardown: (() => void) | void;

        Promise.all([loadScrollSpine(), preload?.()]).then(([spine, extra]) => {
            if (cancelled) {
                return;
            }

            context = spine.gsap.context(() => {
                teardown = build({ ...spine, section }, extra as T);
            }, section);

            // A scene arriving changes the height of the page: its section pins
            // now, and every pin below it starts where this one's spacer ends.
            // Creating a trigger only measures that trigger, so without this the
            // pins further down keep the positions they were given before this
            // scene existed. Refreshing them all re-measures in the running
            // order, which is what refreshPriority is for.
            spine.ScrollTrigger.refresh();
        });

        return () => {
            cancelled = true;
            teardown?.();
            context?.revert();
        };
        // The builder is defined once per scene and never changes identity in a
        // way that should re-run the setup.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [prefersReduced, sectionId]);
};
