import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import AppRoutes from './AppRoutes';
import ErrorBoundary from './common-ui/error-boundary/ErrorBoundary';
import ErrorFallback from './common-ui/error-boundary/ErrorFallback';

const App: React.FC = () => (
    <ErrorBoundary
        fallback={(retry) => (
            <ErrorFallback
                onRetry={retry}
                variant="app"
            />
        )}
    >
        <ThemeProvider>
            <AuthProvider>
                <CartProvider>
                    <BrowserRouter>
                        <AppRoutes />
                    </BrowserRouter>
                </CartProvider>
            </AuthProvider>
        </ThemeProvider>
    </ErrorBoundary>
);

export default App;
