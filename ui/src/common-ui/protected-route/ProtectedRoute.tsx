import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PageFallback from '../page-fallback/PageFallback';

/** Sends signed-out visitors to sign in, remembering where they were headed. */
const ProtectedRoute: React.FC = () => {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) return <PageFallback />;

    return user ? (
        <Outlet />
    ) : (
        <Navigate
            to="/signin"
            replace
            state={{ from: location.pathname + location.search + location.hash }}
        />
    );
};

export default ProtectedRoute;
