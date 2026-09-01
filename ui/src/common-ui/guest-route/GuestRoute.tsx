import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '../../config/navigationConfig';
import { useAuth } from '../../context/AuthContext';
import PageFallback from '../page-fallback/PageFallback';

/** Keeps signed-in users out of account-creation and sign-in forms. */
const GuestRoute: React.FC = () => {
    const { user, isLoading } = useAuth();

    if (isLoading) return <PageFallback />;
    return user ? (
        <Navigate
            to={ROUTES.home}
            replace
        />
    ) : (
        <Outlet />
    );
};

export default GuestRoute;
