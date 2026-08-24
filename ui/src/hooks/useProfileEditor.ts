import { useState } from 'react';
import { User } from '../data/user';
import { useAuth } from '../context/AuthContext';

type EditableFields = Pick<User, 'fullName' | 'email' | 'phone'>;

const toDraft = ({ fullName, email, phone }: User): EditableFields => ({ fullName, email, phone });

/** Edit-in-place state for the profile card and its preference switches. */
export const useProfileEditor = (account: User) => {
    const { updateUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState<EditableFields>(() => toDraft(account));

    const cancel = () => setIsEditing(false);

    return {
        isEditing,
        draft,
        startEditing: () => {
            setDraft(toDraft(account));
            setIsEditing(true);
        },
        cancel,
        updateDraft: (field: keyof EditableFields, value: string) =>
            setDraft((current) => ({ ...current, [field]: value })),
        save: (event: React.FormEvent) => {
            event.preventDefault();
            updateUser(draft);
            setIsEditing(false);
        },
        togglePreference: (key: keyof User['preferences']) =>
            updateUser({
                preferences: { ...account.preferences, [key]: !account.preferences[key] },
            }),
    };
};
