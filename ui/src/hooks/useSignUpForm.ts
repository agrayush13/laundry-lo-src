import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authFailureMessage } from '../services/authServices';
import { useAuth } from '../context/AuthContext';
import { authCallbackUrl, destinationFromState } from '../utils/authUtils';

interface SignUpFields {
    fullName: string;
    email: string;
    phone: string;
    password: string;
}

const EMPTY_FIELDS: SignUpFields = { fullName: '', email: '', phone: '', password: '' };

/** Registration state for Supabase email/password sign-up. */
export const useSignUpForm = () => {
    const { signUp } = useAuth();
    const navigate = useNavigate();
    const { state } = useLocation();
    const redirectTo = destinationFromState(state);
    const [fields, setFields] = useState<SignUpFields>(EMPTY_FIELDS);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);

    return {
        fields,
        isSubmitting,
        error,
        confirmationEmail,
        setField: (name: keyof SignUpFields, value: string) =>
            setFields((current) => ({ ...current, [name]: value })),
        submit: async (event: React.FormEvent) => {
            event.preventDefault();
            setError(null);
            setIsSubmitting(true);
            try {
                const result = await signUp({
                    ...fields,
                    emailRedirectTo: authCallbackUrl(redirectTo),
                });
                if (result.requiresEmailConfirmation) {
                    setConfirmationEmail(fields.email);
                } else {
                    navigate(redirectTo, { replace: true });
                }
            } catch (submitError) {
                setError(authFailureMessage(submitError));
            } finally {
                setIsSubmitting(false);
            }
        },
    };
};
