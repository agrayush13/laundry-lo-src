import { useState } from 'react';
import { authFailureMessage } from '../services/authServices';
import { useAuth } from '../context/AuthContext';
import { passwordRecoveryUrl } from '../utils/authUtils';

/**
 * Requests a Supabase recovery email without revealing whether the account exists.
 */
export const useForgotPasswordForm = () => {
    const { requestPasswordReset } = useAuth();
    const [email, setEmail] = useState('');
    const [isSent, setIsSent] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    return {
        email,
        setEmail,
        isSent,
        isSubmitting,
        error,
        submit: async (event: React.FormEvent) => {
            event.preventDefault();
            setError(null);
            setIsSubmitting(true);
            try {
                await requestPasswordReset(email, passwordRecoveryUrl());
                setIsSent(true);
            } catch (submitError) {
                setError(authFailureMessage(submitError));
            } finally {
                setIsSubmitting(false);
            }
        },
    };
};
