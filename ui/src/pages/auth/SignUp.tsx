import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AUTH_COPY, SIGN_UP_FIELDS } from '../../config/authConfig';
import { ROUTES } from '../../config/navigationConfig';
import { useSignUpForm } from '../../hooks/useSignUpForm';
import AuthCard from './AuthCard';
import OAuthButton from './OAuthButton';
import PasswordField from './PasswordField';
import styles from './auth.module.scss';

const { signUp: copy, divider, fields } = AUTH_COPY;

const SignUp: React.FC = () => {
    const { state } = useLocation();
    const {
        fields: values,
        setField,
        isSubmitting,
        error,
        confirmationEmail,
        submit,
    } = useSignUpForm();

    if (confirmationEmail) {
        return (
            <AuthCard
                title={copy.sentTitle}
                subtitle={copy.sentBody.replace('{email}', confirmationEmail)}
            >
                <p className={styles.authSent}>{copy.sentNote}</p>
                <p className={styles.authSwitch}>
                    <Link to={ROUTES.signIn}>{copy.switchAction}</Link>
                </p>
            </AuthCard>
        );
    }

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
                {SIGN_UP_FIELDS.map(({ name, type }) => (
                    <p
                        key={name}
                        className={styles.authField}
                    >
                        <label htmlFor={name}>{fields[name].label}</label>
                        <input
                            id={name}
                            type={type}
                            autoComplete={fields[name].autoComplete}
                            placeholder={fields[name].placeholder}
                            value={values[name]}
                            onChange={(event) => setField(name, event.target.value)}
                            disabled={isSubmitting}
                            required
                        />
                    </p>
                ))}

                <PasswordField
                    id="new-password"
                    label={fields.password.label}
                    autoComplete="new-password"
                    value={values.password}
                    onChange={(value) => setField('password', value)}
                    minLength={8}
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
                    to={ROUTES.signIn}
                    state={state}
                >
                    {copy.switchAction}
                </Link>
            </p>
        </AuthCard>
    );
};

export default SignUp;
