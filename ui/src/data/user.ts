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

/**
 * Stand-in for the signed-in account until the auth API exists.
 *
 * The addresses are Bengaluru ones, in pincodes the seed actually serves. They
 * used to be in Gurugram, 2,000 km from every partner, which meant the demo
 * modelled a laundry collecting from another state and nothing objected -
 * serviceability is not checked anywhere yet, so the mock data was the only
 * thing saying whether an order made sense.
 */
export const MOCK_USER: User = {
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
