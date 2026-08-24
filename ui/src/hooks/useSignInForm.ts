import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../config/navigationConfig';
import { useAuth } from '../context/AuthContext';

export type SignInMethod = 'email' | 'phone';

/** Credential state for the mock sign-in, returning the user to their target. */
export const useSignInForm = () => {
    const { signIn } = useAuth();
    const navigate = useNavigate();
    const { state } = useLocation();
    const redirectTo = (state as { from?: string } | null)?.from ?? ROUTES.home;

    const [method, setMethod] = useState<SignInMethod>('email');
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');

    return {
        method,
        setMethod,
        identifier,
        setIdentifier,
        password,
        setPassword,
        submit: (event: React.FormEvent) => {
            event.preventDefault();
            signIn(method === 'email' ? identifier : '');
            navigate(redirectTo, { replace: true });
        },
    };
};
