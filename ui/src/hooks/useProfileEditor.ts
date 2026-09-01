import { useState } from 'react';
import { User } from '../data/user';
import { authFailureMessage } from '../services/authServices';
import { useAuth } from '../context/AuthContext';

type EditableFields = Pick<User, 'fullName' | 'email' | 'phone'>;

const toDraft = ({ fullName, email, phone }: User): EditableFields => ({ fullName, email, phone });

/** Edit-in-place state for the profile card and its preference switches. */
export const useProfileEditor = (account: User) => {
    const { updateUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState<EditableFields>(() => toDraft(account));
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false);

    const cancel = () => {
        setError(null);
        setIsEditing(false);
    };

    return {
        isEditing,
        isSaving,
        error,
        emailConfirmationRequired,
        draft,
        startEditing: () => {
            setDraft(toDraft(account));
            setError(null);
            setEmailConfirmationRequired(false);
            setIsEditing(true);
        },
        cancel,
        updateDraft: (field: keyof EditableFields, value: string) =>
            setDraft((current) => ({ ...current, [field]: value })),
        save: async (event: React.FormEvent) => {
            event.preventDefault();
            setError(null);
            setIsSaving(true);
            try {
                const result = await updateUser(draft);
                setEmailConfirmationRequired(result.emailConfirmationRequired);
                setIsEditing(false);
            } catch (saveError) {
                setError(authFailureMessage(saveError));
            } finally {
                setIsSaving(false);
            }
        },
        togglePreference: async (key: keyof User['preferences']) => {
            setError(null);
            try {
                await updateUser({
                    preferences: { ...account.preferences, [key]: !account.preferences[key] },
                });
            } catch (preferenceError) {
                setError(authFailureMessage(preferenceError));
            }
        },
    };
};
