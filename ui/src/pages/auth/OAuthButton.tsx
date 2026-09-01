import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Icon from '../../common-ui/icons/Icon';
import { AUTH_COPY } from '../../config/authConfig';
import { ICON_SIZE } from '../../config/brandConfig';
import { useAuth } from '../../context/AuthContext';
import { authFailureMessage } from '../../services/authServices';
import { authCallbackUrl, destinationFromState } from '../../utils/authUtils';
import styles from './auth.module.scss';

const OAuthButton: React.FC = () => {
    const { signInWithGoogle } = useAuth();
    const { state } = useLocation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const startGoogleSignIn = async () => {
        setError(null);
        setIsSubmitting(true);
        try {
            await signInWithGoogle(authCallbackUrl(destinationFromState(state)));
        } catch (submitError) {
            setError(authFailureMessage(submitError));
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <button
                className={styles.authOauth}
                type="button"
                onClick={startGoogleSignIn}
                disabled={isSubmitting}
            >
                <Icon
                    name="google"
                    size={ICON_SIZE.lg}
                />
                {AUTH_COPY.oauth}
            </button>
            {error && (
                <p
                    className={styles.authError}
                    role="alert"
                >
                    {error}
                </p>
            )}
        </>
    );
};

export default OAuthButton;
