import React, { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useScrollToTop } from '../../hooks/useScrollToTop';
import ErrorBoundary from '../error-boundary/ErrorBoundary';
import ErrorFallback from '../error-boundary/ErrorFallback';
import Footer from '../footer/Footer';
import Header from '../header/Header';
import PageFallback from '../page-fallback/PageFallback';

const Layout: React.FC = () => {
    const { pathname } = useLocation();

    useScrollToTop();

    return (
        <>
            <Header />
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
            <Footer />
        </>
    );
};

export default Layout;
