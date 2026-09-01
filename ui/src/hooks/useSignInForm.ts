import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authFailureMessage } from '../services/authServices';
import { useAuth } from '../context/AuthContext';
import { destinationFromState } from '../utils/authUtils';

/** Email/password sign-in, returning the user to their protected destination. */
export const useSignInForm = () => {
    const { signIn } = useAuth();
    const navigate = useNavigate();
    const { state } = useLocation();
    const redirectTo = destinationFromState(state);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    return {
        email,
        setEmail,
        password,
        setPassword,
        isSubmitting,
        error,
        submit: async (event: React.FormEvent) => {
            event.preventDefault();
            setError(null);
            setIsSubmitting(true);
            try {
                await signIn({ email, password });
                navigate(redirectTo, { replace: true });
            } catch (submitError) {
                setError(authFailureMessage(submitError));
            } finally {
                setIsSubmitting(false);
            }
        },
    };
};
