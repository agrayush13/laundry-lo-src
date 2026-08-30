import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../config/navigationConfig';
import { useAuth } from '../context/AuthContext';

interface SignUpFields {
    fullName: string;
    email: string;
    phone: string;
    password: string;
}

const EMPTY_FIELDS: SignUpFields = { fullName: '', email: '', phone: '', password: '' };

/** Registration state for the mock sign-up. */
export const useSignUpForm = () => {
    const { signUp } = useAuth();
    const navigate = useNavigate();
    const { state } = useLocation();
    const redirectTo = (state as { from?: string } | null)?.from ?? ROUTES.home;
    const [fields, setFields] = useState<SignUpFields>(EMPTY_FIELDS);

    return {
        fields,
        setField: (name: keyof SignUpFields, value: string) =>
            setFields((current) => ({ ...current, [name]: value })),
        submit: (event: React.FormEvent) => {
            event.preventDefault();
            const { fullName, email, phone } = fields;
            signUp({ fullName, email, phone });
            navigate(redirectTo, { replace: true });
        },
    };
};
