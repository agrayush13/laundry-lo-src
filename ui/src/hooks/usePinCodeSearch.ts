import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PIN_CODE_COPY, PIN_CODE_LENGTH } from '../config/bookingConfig';
import { ROUTES } from '../config/navigationConfig';

/**
 * Numeric-only pin code entry that navigates to the matching listing.
 *
 * The button stays enabled and explains itself, rather than sitting disabled: a
 * disabled control gives no reason, and it leaves the tab order, so a keyboard
 * visitor finds the app's headline action has silently vanished instead of
 * objecting. Same rule as checkout's Confirm.
 */
export const usePinCodeSearch = () => {
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);
    const [pinCode, setPinCode] = useState('');
    const [error, setError] = useState<string | null>(null);

    return {
        pinCode,
        error,
        inputRef,
        maxLength: PIN_CODE_LENGTH,
        setPinCode: (value: string) => {
            setPinCode(value.replace(/\D/g, ''));
            setError(null);
        },
        submit: (event: React.FormEvent) => {
            event.preventDefault();

            if (pinCode.length !== PIN_CODE_LENGTH) {
                setError(PIN_CODE_COPY.invalid);
                inputRef.current?.focus();
                return;
            }

            navigate(ROUTES.laundriesForPin(pinCode));
        },
    };
};
