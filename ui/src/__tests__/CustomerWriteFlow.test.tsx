import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MOCK_USER } from '../data/user';
import { STORAGE_KEYS } from '../config/commonConfig';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider, useCart } from '../context/CartContext';
import { fakeAuthService } from '../__mocks__/authService';

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });

const cart = (quantity: number) => ({
    id: 'crt_account',
    partner: { id: '1001', name: 'SparkleWash Express' },
    items: [
        {
            itemId: 'itm_1001_wf-shirt',
            name: 'Shirt / T-shirt',
            description: 'Washed and folded',
            categoryName: 'Wash & Fold',
            iconKey: 'shirt',
            quantity,
            unit: 'piece',
            unitPrice: { amount: 2000, currency: 'INR' },
            lineTotal: { amount: 2000 * quantity, currency: 'INR' },
        },
    ],
    membership: null,
    totals: {
        subtotal: { amount: 2000 * quantity, currency: 'INR' },
        delivery: { amount: 0, currency: 'INR' },
        membership: { amount: 0, currency: 'INR' },
        discount: { amount: 0, currency: 'INR' },
        tax: { amount: 360 * quantity, currency: 'INR' },
        total: { amount: 2360 * quantity, currency: 'INR' },
    },
});

const CartProbe = () => {
    const { lines, total, syncError } = useCart();
    return (
        <>
            <span data-testid="quantity">{lines[0]?.quantity ?? 0}</span>
            <span data-testid="total">{total.amount}</span>
            {syncError && <span role="alert">{syncError}</span>}
        </>
    );
};

describe('authenticated customer state', () => {
    it('hydrates the API profile and merges the larger guest cart quantity', async () => {
        window.localStorage.setItem(
            STORAGE_KEYS.cart,
            JSON.stringify({
                version: 2,
                partner: { id: '1001', name: 'SparkleWash Express' },
                lines: [
                    {
                        item: {
                            id: 'itm_1001_wf-shirt',
                            name: 'Shirt / T-shirt',
                            description: 'Washed and folded',
                            price: { amount: 2000, currency: 'INR' },
                            unit: 'piece',
                            iconKey: 'shirt',
                        },
                        categoryName: 'Wash & Fold',
                        quantity: 3,
                    },
                ],
                hasPlus: false,
            })
        );
        fakeAuthService.authenticate(MOCK_USER);

        let serverQuantity = 1;
        const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
            const path = new URL(String(input), 'http://localhost').pathname.replace('/api/v1', '');
            if (path === '/me') {
                return json({
                    id: MOCK_USER.id,
                    fullName: MOCK_USER.fullName,
                    email: MOCK_USER.email,
                    phone: MOCK_USER.phone,
                    memberSince: MOCK_USER.memberSince,
                    preferences: MOCK_USER.preferences,
                });
            }
            if (path === '/addresses') return json({ data: MOCK_USER.addresses });
            if (path === '/cart' && init?.method === 'GET') return json(cart(serverQuantity));
            if (path === '/cart/items/itm_1001_wf-shirt' && init?.method === 'PUT') {
                serverQuantity = (JSON.parse(String(init.body)) as { quantity: number }).quantity;
                return json(cart(serverQuantity));
            }
            return json(
                { error: { code: 'NOT_FOUND', message: 'No such endpoint.', requestId: 'test' } },
                404
            );
        });
        vi.stubGlobal('fetch', fetch);

        render(
            <AuthProvider
                service={fakeAuthService}
                profileSource="api"
            >
                <CartProvider>
                    <CartProbe />
                </CartProvider>
            </AuthProvider>
        );

        expect(await screen.findByTestId('quantity')).toHaveTextContent('3');
        expect(screen.getByTestId('total')).toHaveTextContent('7080');
        expect(screen.queryByRole('alert')).toBeNull();
        await waitFor(() => expect(window.localStorage.getItem(STORAGE_KEYS.cart)).toBeNull());
        expect(fetch).toHaveBeenCalledWith(
            '/api/v1/cart/items/itm_1001_wf-shirt',
            expect.objectContaining({ method: 'PUT', body: JSON.stringify({ quantity: 3 }) })
        );
    });
});
