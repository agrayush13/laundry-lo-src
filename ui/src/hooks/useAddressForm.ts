import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Address, emptyAddress } from '../models/bookingModels';
import { SavedAddress, User } from '../data/user';
import { PIN_CODE_LENGTH } from '../config/bookingConfig';
import { ROUTES } from '../config/navigationConfig';
import { useAuth } from '../context/AuthContext';

const isComplete = ({ recipientName, phone, building, street, pincode }: Address) =>
    Boolean(recipientName.trim() && phone.trim() && building.trim() && street.trim()) &&
    pincode.length === PIN_CODE_LENGTH;

const toId = (label: string) => `${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

/** Collects a new saved address and appends it to the account. */
export const useAddressForm = () => {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const account = user as User;

    const [label, setLabel] = useState('');
    const [address, setAddress] = useState<Address>(() => ({
        ...emptyAddress(''),
        // The account holder is the usual recipient, so prefill their details.
        recipientName: account.fullName,
        phone: account.phone,
    }));

    const canSave = Boolean(label.trim()) && isComplete(address);

    return {
        label,
        address,
        canSave,
        setLabel,
        updateAddress: (field: keyof Address, value: string) =>
            setAddress((current) => ({ ...current, [field]: value })),
        save: (event: React.FormEvent) => {
            event.preventDefault();
            if (!canSave) {
                return;
            }

            const saved: SavedAddress = { ...address, id: toId(label), label: label.trim() };
            updateUser({ addresses: [...account.addresses, saved] });
            navigate(ROUTES.profile);
        },
        cancel: () => navigate(ROUTES.profile),
    };
};
