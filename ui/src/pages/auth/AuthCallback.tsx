import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PageFallback from '../../common-ui/page-fallback/PageFallback';
import { AUTH_COPY } from '../../config/authConfig';
import { ROUTES } from '../../config/navigationConfig';
import { useAuth } from '../../context/AuthContext';
import { hasAuthCallbackError, safeAuthDestination } from '../../utils/authUtils';
import AuthCard from './AuthCard';
import styles from './auth.module.scss';

const { callback: copy } = AUTH_COPY;

const AuthCallback: React.FC = () => {
    const { user, isLoading } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const query = new URLSearchParams(location.search);
    const providerError = hasAuthCallbackError(location);
    const destination = safeAuthDestination(query.get('next'));

    useEffect(() => {
        if (!isLoading && user && !providerError) {
            navigate(destination, { replace: true });
        }
    }, [destination, isLoading, navigate, providerError, user]);

    if (isLoading || (user && !providerError)) return <PageFallback />;

    return (
        <AuthCard
            title={copy.errorTitle}
            subtitle={copy.errorBody}
        >
            <p className={styles.authSwitch}>
                <Link to={ROUTES.signIn}>{copy.action}</Link>
            </p>
        </AuthCard>
    );
};

export default AuthCallback;
