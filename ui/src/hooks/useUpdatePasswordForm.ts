import { useState } from 'react';
import { authFailureMessage } from '../services/authServices';
import { AUTH_COPY } from '../config/authConfig';
import { useAuth } from '../context/AuthContext';

const { updatePassword: copy } = AUTH_COPY;

export const useUpdatePasswordForm = () => {
    const { updatePassword } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUpdated, setIsUpdated] = useState(false);
    const [error, setError] = useState<string | null>(null);

    return {
        password,
        setPassword,
        confirmation,
        setConfirmation,
        isSubmitting,
        isUpdated,
        error,
        submit: async (event: React.FormEvent) => {
            event.preventDefault();
            setError(null);

            if (password.length < 8) {
                setError(copy.tooShort);
                return;
            }
            if (password !== confirmation) {
                setError(copy.mismatch);
                return;
            }

            setIsSubmitting(true);
            try {
                await updatePassword(password);
                setIsUpdated(true);
            } catch (submitError) {
                setError(authFailureMessage(submitError));
            } finally {
                setIsSubmitting(false);
            }
        },
    };
};
