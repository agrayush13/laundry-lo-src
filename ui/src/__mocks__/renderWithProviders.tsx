import { render } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { MOCK_USER } from '../data/user';
import { STORAGE_KEYS } from '../config/commonConfig';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { ThemeProvider } from '../context/ThemeContext';
import AppRoutes from '../AppRoutes';

/** Starts an integration test with the same mock account the sign-in form creates. */
export const authenticateTestUser = () => {
    window.localStorage.setItem(STORAGE_KEYS.user, JSON.stringify({ version: 1, user: MOCK_USER }));
};

/** Mounts the whole app at `path` with every provider the routes expect. */
export const renderApp = (path = '/') =>
    render(
        <ThemeProvider>
            <AuthProvider>
                <CartProvider>
                    <MemoryRouter initialEntries={[path]}>
                        <AppRoutes />
                    </MemoryRouter>
                </CartProvider>
            </AuthProvider>
        </ThemeProvider>
    );
