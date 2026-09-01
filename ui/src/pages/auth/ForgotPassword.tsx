import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../../common-ui/icons/Icon';
import { AUTH_COPY } from '../../config/authConfig';
import { ICON_SIZE } from '../../config/brandConfig';
import { ROUTES } from '../../config/navigationConfig';
import { useForgotPasswordForm } from '../../hooks/useForgotPasswordForm';
import AuthCard from './AuthCard';
import styles from './auth.module.scss';

const { forgotPassword: copy, fields } = AUTH_COPY;

const ForgotPassword: React.FC = () => {
    const { state } = useLocation();
    const { email, setEmail, isSent, isSubmitting, error, submit } = useForgotPasswordForm();

    if (isSent) {
        return (
            <AuthCard
                title={copy.sentTitle}
                subtitle={copy.sentBody.replace('{email}', email)}
            >
                <p className={styles.authSent}>
                    <Icon
                        name="check-circle"
                        size={ICON_SIZE.sm}
                    />
                    {copy.sentNote}
                </p>
                <p className={styles.authSwitch}>
                    <Link
                        to={ROUTES.signIn}
                        state={state}
                    >
                        {copy.backToSignIn}
                    </Link>
                </p>
            </AuthCard>
        );
    }

    return (
        <AuthCard
            title={copy.title}
            subtitle={copy.subtitle}
        >
            <form
                className={styles.authForm}
                onSubmit={submit}
            >
                <p className={styles.authField}>
                    <label htmlFor="reset-email">{fields.email.label}</label>
                    <input
                        id="reset-email"
                        type="email"
                        autoComplete="email"
                        placeholder={fields.email.placeholder}
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        disabled={isSubmitting}
                        required
                    />
                </p>

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
                <Link
                    to={ROUTES.signIn}
                    state={state}
                >
                    {copy.backToSignIn}
                </Link>
            </p>
        </AuthCard>
    );
};

export default ForgotPassword;
