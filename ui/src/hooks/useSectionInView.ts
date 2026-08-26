import { useEffect, useState } from 'react';

/**
 * Whether a section is currently on screen, watched by id rather than by ref so
 * a component can react to a section it does not own and never has to be handed
 * one through the tree.
 */
export const useSectionInView = (id: string) => {
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const section = document.getElementById(id);
        if (!section || typeof IntersectionObserver === 'undefined') {
            return undefined;
        }

        const observer = new IntersectionObserver(
            ([entry]) => setInView(entry.isIntersecting),
            // Most of the section has to be showing: brushing past its edge is
            // not arriving at it.
            { threshold: 0.4 }
        );

        observer.observe(section);
        return () => observer.disconnect();
    }, [id]);

    return inView;
};
