import { useState } from 'react';

/**
 * Mock reset flow: it records the address and shows the confirmation the real
 * endpoint will produce, without pretending an email was sent.
 */
export const useForgotPasswordForm = () => {
    const [email, setEmail] = useState('');
    const [isSent, setIsSent] = useState(false);

    return {
        email,
        setEmail,
        isSent,
        submit: (event: React.FormEvent) => {
            event.preventDefault();
            setIsSent(true);
        },
    };
};
