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
    addAddress: 'Add New',
    noAddresses: 'No saved addresses yet.',
    comingSoon: 'Coming soon',
    backToProfile: 'Back to profile',
    addAddressTitle: 'Add an address',
    addAddressSubtitle: 'Saved addresses appear as options when you check out.',
    labelField: 'Label',
    labelPlaceholder: 'e.g. Home',
    saveAddress: 'Save address',
} as const;

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
