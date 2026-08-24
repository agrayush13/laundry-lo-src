import { render } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { ThemeProvider } from '../context/ThemeContext';
import AppRoutes from '../AppRoutes';

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
