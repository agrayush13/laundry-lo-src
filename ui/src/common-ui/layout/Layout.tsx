import React, { Suspense, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from '../../config/navigationConfig';
import { usePageAnnouncement } from '../../hooks/usePageAnnouncement';
import { useScrollToTop } from '../../hooks/useScrollToTop';
import ErrorBoundary from '../error-boundary/ErrorBoundary';
import ErrorFallback from '../error-boundary/ErrorFallback';
import Footer from '../footer/Footer';
import Header from '../header/Header';
import PageFallback from '../page-fallback/PageFallback';

const Layout: React.FC = () => {
    const { pathname } = useLocation();
    const main = useRef<HTMLElement>(null);

    useScrollToTop();
    const pageName = usePageAnnouncement(main);

    // The journey is one continuous cycle: it carries its own two-item header and
    // ends in its own footer, so the app chrome would be a third voice on a page
    // that is meant to read as one. Every other route, the homepage included,
    // gets the usual chrome.
    const isCycle = pathname === ROUTES.journey;

    return (
        <>
            <a
                className="skip-link"
                href="#main-content"
            >
                Skip to content
            </a>
            {!isCycle && <Header />}
            {/*
             * Announces the new page after a client-side navigation. Present
             * from the first render and empty of new content then, so a page
             * load does not announce; every later change to it does.
             */}
            <p
                className="visually-hidden"
                role="status"
                aria-live="polite"
            >
                {pageName}
            </p>
            <main
                id="main-content"
                ref={main}
                tabIndex={-1}
            >
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
