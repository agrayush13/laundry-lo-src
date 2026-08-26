import React, { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from '../../config/navigationConfig';
import { useScrollToTop } from '../../hooks/useScrollToTop';
import ErrorBoundary from '../error-boundary/ErrorBoundary';
import ErrorFallback from '../error-boundary/ErrorFallback';
import Footer from '../footer/Footer';
import Header from '../header/Header';
import PageFallback from '../page-fallback/PageFallback';

const Layout: React.FC = () => {
    const { pathname } = useLocation();

    useScrollToTop();

    // The journey is one continuous cycle: it carries its own two-item header and
    // ends in its own footer, so the app chrome would be a third voice on a page
    // that is meant to read as one. Every other route, the homepage included,
    // gets the usual chrome.
    const isCycle = pathname === ROUTES.journey;

    return (
        <>
            {!isCycle && <Header />}
            <main>
                <ErrorBoundary
                    resetKey={pathname}
                    fallback={(retry) => <ErrorFallback onRetry={retry} />}
                >
                    <Suspense fallback={<PageFallback />}>
                        <Outlet />
                    </Suspense>
                </ErrorBoundary>
            </main>
            {!isCycle && <Footer />}
        </>
    );
};

export default Layout;
