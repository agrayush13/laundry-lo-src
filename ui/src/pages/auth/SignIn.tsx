import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AUTH_COPY } from '../../config/authConfig';
import { ROUTES } from '../../config/navigationConfig';
import { useSignInForm } from '../../hooks/useSignInForm';
import AuthCard from './AuthCard';
import OAuthButton from './OAuthButton';
import PasswordField from './PasswordField';
import styles from './auth.module.scss';

const { signIn: copy, divider, fields } = AUTH_COPY;

const SignIn: React.FC = () => {
    const { state } = useLocation();
    const { email, setEmail, password, setPassword, isSubmitting, error, submit } = useSignInForm();

    return (
        <AuthCard
            title={copy.title}
            subtitle={copy.subtitle}
        >
            <OAuthButton />

            <p className={styles.authDivider}>{divider}</p>

            <form
                className={styles.authForm}
                onSubmit={submit}
            >
                <p className={styles.authField}>
                    <label htmlFor="email">{fields.email.label}</label>
                    <input
                        id="email"
                        type="email"
                        autoComplete={fields.email.autoComplete}
                        placeholder={fields.email.placeholder}
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        disabled={isSubmitting}
                        required
                    />
                </p>

                <PasswordField
                    id="password"
                    label={fields.password.label}
                    autoComplete="current-password"
                    value={password}
                    onChange={setPassword}
                    disabled={isSubmitting}
                />

                {error && (
                    <p
                        className={styles.authError}
                        role="alert"
                    >
                        {error}
                    </p>
                )}

                <p className={styles.authForgot}>
                    <Link
                        to={ROUTES.forgotPassword}
                        state={state}
                    >
                        {copy.forgot}
                    </Link>
                </p>

                <button
                    className={`button button--primary ${styles.authSubmit}`}
                    type="submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? copy.submitting : copy.submit}
                </button>
            </form>

            <p className={styles.authSwitch}>
                {copy.switchPrompt}{' '}
                <Link
                    to={ROUTES.signUp}
                    state={state}
                >
                    {copy.switchAction}
                </Link>
            </p>
        </AuthCard>
    );
};

export default SignIn;
