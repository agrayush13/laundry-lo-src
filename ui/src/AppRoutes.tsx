import React, { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './common-ui/layout/Layout';
import ProtectedRoute from './common-ui/protected-route/ProtectedRoute';
import Home from './pages/home/Home';

// Home ships in the initial bundle - it is the common entry point. Every other
// route is fetched on demand; Layout provides the Suspense boundary.
const SignIn = lazy(() => import('./pages/auth/SignIn'));
const SignUp = lazy(() => import('./pages/auth/SignUp'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const PlusPage = lazy(() => import('./pages/plus/PlusPage'));
const JourneyPage = lazy(() => import('./pages/journey/JourneyPage'));
const TermsPage = lazy(() => import('./pages/terms/TermsPage'));
const ServicesPage = lazy(() => import('./pages/services/ServicesPage'));
const PartnerPage = lazy(() => import('./pages/partner/PartnerPage'));
const CartPage = lazy(() => import('./pages/cart/CartPage'));
const CheckoutPage = lazy(() => import('./pages/checkout/CheckoutPage'));
const OrderConfirmed = lazy(() => import('./pages/checkout/OrderConfirmed'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));
const AddAddressPage = lazy(() => import('./pages/profile/AddAddressPage'));
const BookingsPage = lazy(() => import('./pages/bookings/BookingsPage'));
const OrderDetailPage = lazy(() => import('./pages/bookings/OrderDetailPage'));

const AppRoutes: React.FC = () => (
    <Routes>
        <Route element={<Layout />}>
            <Route
                index
                element={<Home />}
            />
            <Route
                path="signin"
                element={<SignIn />}
            />
            <Route
                path="signup"
                element={<SignUp />}
            />
            <Route
                path="forgot-password"
                element={<ForgotPassword />}
            />
            <Route
                path="plus"
                element={<PlusPage />}
            />
            <Route
                path="journey"
                element={<JourneyPage />}
            />
            <Route
                path="terms"
                element={<TermsPage />}
            />
            <Route
                path="laundries"
                element={<ServicesPage />}
            />
            <Route
                path="laundries/:partnerId"
                element={<PartnerPage />}
            />
            <Route
                path="cart"
                element={<CartPage />}
            />
            <Route element={<ProtectedRoute />}>
                <Route
                    path="checkout"
                    element={<CheckoutPage />}
                />
                <Route
                    path="order-confirmed"
                    element={<OrderConfirmed />}
                />
                <Route
                    path="profile"
                    element={<ProfilePage />}
                />
                <Route
                    path="profile/addresses/new"
                    element={<AddAddressPage />}
                />
                <Route
                    path="bookings"
                    element={<BookingsPage />}
                />
                <Route
                    path="bookings/:orderId"
                    element={<OrderDetailPage />}
                />
            </Route>

            <Route
                path="*"
                element={
                    <Navigate
                        to="/"
                        replace
                    />
                }
            />
        </Route>
    </Routes>
);

export default AppRoutes;
