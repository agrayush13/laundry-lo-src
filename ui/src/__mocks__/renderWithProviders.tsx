import { render } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { MOCK_USER } from '../data/user';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { ThemeProvider } from '../context/ThemeContext';
import AppRoutes from '../AppRoutes';
import { fakeAuthService } from './authService';

/** Starts an integration test with the same account the fake auth provider creates. */
export const authenticateTestUser = () => {
    fakeAuthService.authenticate(MOCK_USER);
};

/** Starts an integration test as a user who arrived through a recovery link. */
export const recoverTestUser = () => {
    fakeAuthService.recover(MOCK_USER);
};

/** Mounts the whole app at `path` with every provider the routes expect. */
export const renderApp = (path = '/') =>
    render(
        <ThemeProvider>
            <AuthProvider service={fakeAuthService}>
                <CartProvider>
                    <MemoryRouter initialEntries={[path]}>
                        <AppRoutes />
                    </MemoryRouter>
                </CartProvider>
            </AuthProvider>
        </ThemeProvider>
    );
