import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BRAND } from '../../config/brandConfig';
import { HEADER_ACTIONS, PRIMARY_NAV, ROUTES } from '../../config/navigationConfig';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { toInitials } from '../../hooks/useInitials';
import { authFailureMessage } from '../../services/authServices';
import Icon from '../icons/Icon';
import Logo from '../logo/Logo';
import ThemeToggle from '../theme-toggle/ThemeToggle';
import styles from './header.module.scss';

const { guest, authenticated, cart } = HEADER_ACTIONS;

const Header: React.FC = () => {
    const { user, isLoading, signOut } = useAuth();
    const { itemCount, hasPlus } = useCart();
    // Plus counts as a line so the badge matches what the cart shows.
    const cartCount = itemCount + (hasPlus ? 1 : 0);
    const navigate = useNavigate();
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [signOutError, setSignOutError] = useState<string | null>(null);

    const handleSignOut = async () => {
        setSignOutError(null);
        setIsSigningOut(true);
        try {
            await signOut();
            navigate(ROUTES.home);
        } catch (error) {
            setSignOutError(authFailureMessage(error));
            setIsSigningOut(false);
        }
    };

    return (
        <header className={styles.header}>
            <div className={styles.headerInner}>
                <Link
                    className={styles.headerBrand}
                    to={ROUTES.home}
                    aria-label={`${BRAND.name} home`}
                >
                    <Logo />
                </Link>

                <nav
                    className={styles.headerNav}
                    aria-label="Primary"
                >
                    {/* Router links, not plain anchors: a bare href to
                        "/#how-it-works" is a full page load, and the browser
                        looks for the section before React has drawn it.

                        Nothing here points at the journey; see PRIMARY_NAV. */}
                    {PRIMARY_NAV.map(({ label, href }) => (
                        <Link
                            key={href}
                            className={styles.headerLink}
                            to={href}
                        >
                            {label}
                        </Link>
                    ))}
                </nav>

                <div className={styles.headerActions}>
                    <span className={styles.headerTheme}>
                        <ThemeToggle />
                    </span>
                    <Link
                        className={styles.headerCart}
                        to={cart.href}
                        aria-label={cartCount > 0 ? `${cart.label} (${cartCount})` : cart.label}
                    >
                        <Icon name={cart.icon} />
                        {cartCount > 0 && (
                            <span
                                className={styles.headerCartCount}
                                aria-hidden="true"
                            >
                                {cartCount}
                            </span>
                        )}
                    </Link>
                    {isLoading ? null : user ? (
                        <>
                            <Link
                                className={styles.headerBookings}
                                to={authenticated.bookings.href}
                                aria-label={authenticated.bookings.label}
                            >
                                <Icon name={authenticated.bookings.icon} />
                                <span className={styles.headerLabel}>
                                    {authenticated.bookings.label}
                                </span>
                            </Link>
                            <Link
                                className={styles.headerAccount}
                                to={authenticated.profile.href}
                                aria-label={user.fullName}
                            >
                                <span
                                    className={styles.headerAvatar}
                                    aria-hidden="true"
                                >
                                    {toInitials(user.fullName)}
                                </span>
                                <span className={styles.headerLabel}>
                                    {user.fullName.split(' ')[0]}
                                </span>
                            </Link>
                            <button
                                className={styles.headerSignout}
                                type="button"
                                aria-label={authenticated.signOut.label}
                                onClick={() => void handleSignOut()}
                                disabled={isSigningOut}
                            >
                                <Icon name={authenticated.signOut.icon} />
                            </button>
                            {signOutError && (
                                <span
                                    className={styles.headerAuthError}
                                    role="alert"
                                >
                                    {signOutError}
                                </span>
                            )}
                        </>
                    ) : (
                        <>
                            <Link
                                className={styles.headerSignin}
                                to={guest.signIn.href}
                                aria-label={guest.signIn.label}
                            >
                                <Icon name={guest.signIn.icon} />
                                <span className={styles.headerLabel}>{guest.signIn.label}</span>
                            </Link>
                            <Link
                                className={`button button--primary ${styles.headerCta}`}
                                to={guest.cta.href}
                            >
                                {guest.cta.label}
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
