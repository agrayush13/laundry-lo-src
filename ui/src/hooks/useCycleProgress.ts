import { useEffect, useState } from 'react';

const readProgress = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    return scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
};

/**
 * How far through the cycle the page is, from 0 to 1. Read straight from the
 * document rather than from the spine, so the dial fills correctly under
 * reduced motion, before the spine has loaded, and on a plain native scroll.
 */
export const useCycleProgress = () => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let frame = 0;

        const update = () => {
            frame = 0;
            // Rounded before it is stored, so scrolling a pixel does not re-render
            // the dial sixty times a second for a change nobody can see.
            setProgress((current) => {
                const next = Math.round(readProgress() * 200) / 200;
                return next === current ? current : next;
            });
        };

        // Scroll fires far more often than the dial can usefully change, so
        // coalesce to one read per frame.
        const onScroll = () => {
            frame = frame || window.requestAnimationFrame(update);
        };

        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);

        return () => {
            window.cancelAnimationFrame(frame);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, []);

    return progress;
};
