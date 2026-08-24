import { Address } from '../models/bookingModels';

export interface SavedAddress extends Address {
    id: string;
    label: string;
}

export interface User {
    fullName: string;
    email: string;
    phone: string;
    memberSince: string;
    addresses: SavedAddress[];
    preferences: { sms: boolean; email: boolean };
}

/** Stand-in for the signed-in account until the auth API exists. */
export const MOCK_USER: User = {
    fullName: 'Ayush Agrawal',
    email: 'ayush.agrawal@gmail.com',
    phone: '+91 98765 43210',
    memberSince: 'January 2024',
    addresses: [
        {
            id: 'home',
            label: 'Home',
            recipientName: 'Ayush Agrawal',
            phone: '+91 98765 43210',
            building: '42',
            street: 'Sector 15, Gurugram, Haryana',
            landmark: '',
            pincode: '122001',
        },
        {
            id: 'office',
            label: 'Office',
            recipientName: 'Ayush Agrawal',
            phone: '+91 98765 43210',
            building: 'WeWork, Cyber Hub',
            street: 'DLF Phase 2, Gurugram',
            landmark: '',
            pincode: '122002',
        },
    ],
    preferences: { sms: true, email: false },
};
