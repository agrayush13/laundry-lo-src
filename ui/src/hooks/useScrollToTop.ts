import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Resets scroll position on navigation, as a new page load would. */
export const useScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
};
