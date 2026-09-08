import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '../services/analyticsServices';

/** Sends one sanitized page view after the router and document title update. */
export const useAnalyticsPageView = () => {
    const { pathname, search } = useLocation();

    useEffect(() => {
        analytics.trackPageView(pathname, search);
    }, [pathname, search]);
};
