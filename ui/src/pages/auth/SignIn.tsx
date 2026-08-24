import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../common-ui/icons/Icon';
import { IconName } from '../../common-ui/icons/registry';
import { AUTH_COPY } from '../../config/authConfig';
import { ICON_SIZE } from '../../config/brandConfig';
import { ROUTES } from '../../config/navigationConfig';
import { SignInMethod, useSignInForm } from '../../hooks/useSignInForm';
import AuthCard from './AuthCard';
import OAuthButton from './OAuthButton';
import PasswordField from './PasswordField';
import styles from './auth.module.scss';

const { signIn: copy, divider, fields, methods } = AUTH_COPY;

const SignIn: React.FC = () => {
    const { method, setMethod, identifier, setIdentifier, password, setPassword, submit } =
        useSignInForm();
    const field = method === 'email' ? fields.email : fields.phone;

    return (
        <AuthCard
            title={copy.title}
            subtitle={copy.subtitle}
        >
            <OAuthButton />

            <p className={styles.authDivider}>{divider}</p>

            <div
                className={styles.authMethods}
                role="tablist"
                aria-label="Sign in method"
            >
                {methods.map(({ value, label, icon }) => (
                    <button
                        key={value}
                        type="button"
                        role="tab"
                        aria-selected={method === value}
                        className={styles.authMethod}
                        onClick={() => setMethod(value as SignInMethod)}
                    >
                        <Icon
                            name={icon as IconName}
                            size={ICON_SIZE.sm}
                        />
                        {label}
                    </button>
                ))}
            </div>

            <form
                className={styles.authForm}
                onSubmit={submit}
            >
                <p className={styles.authField}>
                    <label htmlFor="identifier">{field.label}</label>
                    <input
                        id="identifier"
                        type={method === 'email' ? 'email' : 'tel'}
                        autoComplete={field.autoComplete}
                        placeholder={field.placeholder}
                        value={identifier}
                        onChange={(event) => setIdentifier(event.target.value)}
                        required
                    />
                </p>

                <PasswordField
                    id="password"
                    label={fields.password.label}
                    autoComplete="current-password"
                    value={password}
                    onChange={setPassword}
                />

                <p className={styles.authForgot}>
                    <Link to={ROUTES.forgotPassword}>{copy.forgot}</Link>
                </p>

                <button
                    className={`button button--primary ${styles.authSubmit}`}
                    type="submit"
                >
                    {copy.submit}
                </button>
            </form>

            <p className={styles.authSwitch}>
                {copy.switchPrompt} <Link to={ROUTES.signUp}>{copy.switchAction}</Link>
            </p>
        </AuthCard>
    );
};

export default SignIn;
