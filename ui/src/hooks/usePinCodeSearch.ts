import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PIN_CODE_LENGTH } from '../config/bookingConfig';
import { ROUTES } from '../config/navigationConfig';

/** Numeric-only pin code entry that navigates to the matching listing. */
export const usePinCodeSearch = () => {
    const navigate = useNavigate();
    const [pinCode, setPinCode] = useState('');

    const isValid = pinCode.length === PIN_CODE_LENGTH;

    return {
        pinCode,
        isValid,
        maxLength: PIN_CODE_LENGTH,
        setPinCode: (value: string) => setPinCode(value.replace(/\D/g, '')),
        submit: (event: React.FormEvent) => {
            event.preventDefault();
            if (isValid) {
                navigate(ROUTES.laundriesForPin(pinCode));
            }
        },
    };
};
