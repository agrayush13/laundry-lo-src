import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Address, emptyAddress } from '../models/bookingModels';
import { SavedAddress, User } from '../data/user';
import { VALIDATION_COPY } from '../config/bookingConfig';
import { ROUTES } from '../config/navigationConfig';
import { LABEL_FIELD_ID, PROFILE_COPY, SAVED_ADDRESS_ID_PREFIX } from '../config/profileConfig';
import { useAuth } from '../context/AuthContext';
import { addressFieldId, isValidPhone, isValidPinCode } from '../utils/addressUtils';
import { focusField } from '../utils/formUtils';

/** `label` is this form's own; the rest are the shared address fields. */
export type AddressFormField = 'label' | keyof Omit<Address, 'landmark'>;

const toId = (label: string) => `${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

/**
 * Collects a new saved address and appends it to the account.
 *
 * Ordered so the first problem found is the one nearest the top, and reported
 * rather than expressed as a disabled button: the same rule checkout follows.
 */
const findProblems = (label: string, address: Address): AddressFormField[] => {
    const problems: AddressFormField[] = [];

    if (!label.trim()) problems.push('label');
    if (!address.recipientName.trim()) problems.push('recipientName');
    if (!isValidPhone(address.phone)) problems.push('phone');
    if (!address.building.trim()) problems.push('building');
    if (!address.street.trim()) problems.push('street');
    if (!isValidPinCode(address.pincode)) problems.push('pincode');

    return problems;
};

const messageFor = (field: AddressFormField) =>
    field === 'label' ? PROFILE_COPY.labelRequired : VALIDATION_COPY[field];

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
    const [errors, setErrors] = useState<Partial<Record<AddressFormField, string>>>({});

    const clearError = (field: AddressFormField) =>
        setErrors((current) => {
            if (!current[field]) {
                return current;
            }

            const next = { ...current };
            delete next[field];
            return next;
        });

    return {
        label,
        address,
        errors,
        setLabel: (value: string) => {
            setLabel(value);
            clearError('label');
        },
        updateAddress: (field: keyof Address, value: string) => {
            setAddress((current) => ({ ...current, [field]: value }));
            clearError(field as AddressFormField);
        },
        save: (event: React.FormEvent) => {
            event.preventDefault();
            const problems = findProblems(label, address);

            if (problems.length > 0) {
                setErrors(Object.fromEntries(problems.map((field) => [field, messageFor(field)])));
                // The label input is this page's own and is not one of the
                // shared address fields, so it carries its own id.
                focusField(
                    problems[0] === 'label'
                        ? LABEL_FIELD_ID
                        : addressFieldId(SAVED_ADDRESS_ID_PREFIX, problems[0]!)
                );
                return;
            }

            const saved: SavedAddress = { ...address, id: toId(label), label: label.trim() };
            updateUser({ addresses: [...account.addresses, saved] });
            navigate(ROUTES.profile);
        },
        cancel: () => navigate(ROUTES.profile),
    };
};
