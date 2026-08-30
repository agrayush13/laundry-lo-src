/**
 * Brings the first thing wrong with a form into view and, where it is an input,
 * puts the cursor in it. Shared so that every form which explains itself does so
 * the same way, rather than each one inventing its own idea of "go here".
 */
export const focusField = (id: string) => {
    const target = document.getElementById(id);
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    target?.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'center' });

    if (target instanceof HTMLInputElement) {
        target.focus({ preventScroll: true });
    }
};
