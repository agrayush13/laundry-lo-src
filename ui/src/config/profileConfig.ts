import { User } from '../data/user';
import { IconName } from '../common-ui/icons/registry';

export interface PreferenceConfig {
    key: keyof User['preferences'];
    title: string;
    description: string;
}

export const PROFILE_COPY = {
    back: 'Back',
    memberSincePrefix: 'Member since',
    personalInformation: 'Personal Information',
    savedAddresses: 'Saved Addresses',
    preferences: 'Preferences',
    edit: 'Edit',
    cancel: 'Cancel',
    save: 'Save Changes',
    saving: 'Saving...',
    emailConfirmation:
        'Check both your current and new inboxes to confirm the email address change.',
    addAddress: 'Add New',
    noAddresses: 'No saved addresses yet.',
    comingSoon: 'Coming soon',
    backToProfile: 'Back to profile',
    addAddressTitle: 'Add an address',
    editAddressTitle: 'Edit address',
    addAddressSubtitle: 'Saved addresses appear as options when you check out.',
    labelField: 'Label',
    labelPlaceholder: 'e.g. Home',
    saveAddress: 'Save address',
    updateAddress: 'Update address',
    savingAddress: 'Saving...',
    saveAddressError: "We couldn't save that address. Try again.",
    labelRequired: 'Name this address, so you can pick it at checkout.',
} as const;

/** Shared by the input and by whatever has to send focus back to it. */
export const LABEL_FIELD_ID = 'address-label';
export const SAVED_ADDRESS_ID_PREFIX = 'saved-address';

export const ADDRESS_LABEL_SUGGESTIONS = ['Home', 'Office', 'Parents'] as const;

export const PROFILE_FIELDS: {
    name: 'fullName' | 'email' | 'phone';
    label: string;
    icon?: IconName;
    type?: string;
}[] = [
    { name: 'fullName', label: 'Full Name' },
    { name: 'email', label: 'Email', icon: 'mail', type: 'email' },
    { name: 'phone', label: 'Phone', icon: 'phone', type: 'tel' },
];

export const PREFERENCES: PreferenceConfig[] = [
    { key: 'sms', title: 'SMS Notifications', description: 'Get order updates via SMS' },
    { key: 'email', title: 'Email Notifications', description: 'Receive promotional offers' },
];
