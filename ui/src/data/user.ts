import { Address } from '../models/bookingModels';

export interface SavedAddress extends Address {
    id: string;
    label: string;
    isDefault?: boolean;
}

export interface User {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    memberSince: string;
    addresses: SavedAddress[];
    preferences: { sms: boolean; email: boolean };
}

/** Test-only identity data. Production profiles and addresses come from the API. */
export const MOCK_USER: User = {
    id: '00000000-0000-4000-8000-000000000001',
    fullName: 'Ayush Agrawal',
    email: 'ayush.agrawal@gmail.com',
    phone: '+91 98765 43210',
    // ISO 8601, per api-contract.md section 1: no pre-formatted display strings.
    memberSince: '2024-01-14T00:00:00Z',
    addresses: [
        {
            id: 'home',
            label: 'Home',
            recipientName: 'Ayush Agrawal',
            phone: '+91 98765 43210',
            building: '42',
            street: 'Sector 5, HSR Layout, Bengaluru',
            landmark: '',
            pincode: '560103',
        },
        {
            id: 'office',
            label: 'Office',
            recipientName: 'Ayush Agrawal',
            phone: '+91 98765 43210',
            building: 'WeWork, Embassy Golf Links',
            street: 'Domlur, Bengaluru',
            landmark: '',
            pincode: '560102',
        },
    ],
    preferences: { sms: true, email: false },
};
