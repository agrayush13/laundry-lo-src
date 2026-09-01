import React from 'react';
import { Link } from 'react-router-dom';
import PageFallback from '../../common-ui/page-fallback/PageFallback';
import { AUTH_COPY } from '../../config/authConfig';
import { ROUTES } from '../../config/navigationConfig';
import { useAuth } from '../../context/AuthContext';
import { useUpdatePasswordForm } from '../../hooks/useUpdatePasswordForm';
import AuthCard from './AuthCard';
import PasswordField from './PasswordField';
import styles from './auth.module.scss';

const { updatePassword: copy } = AUTH_COPY;

const UpdatePassword: React.FC = () => {
    const { user, isLoading, isPasswordRecovery } = useAuth();
    const form = useUpdatePasswordForm();

    if (isLoading) return <PageFallback />;

    if (!user || !isPasswordRecovery) {
        return (
            <AuthCard
                title={copy.invalidTitle}
                subtitle={copy.invalidBody}
            >
                <p className={styles.authSwitch}>
                    <Link to={ROUTES.forgotPassword}>{copy.invalidAction}</Link>
                </p>
            </AuthCard>
        );
    }

    if (form.isUpdated) {
        return (
            <AuthCard
                title={copy.successTitle}
                subtitle={copy.successBody}
            >
                <p className={styles.authSwitch}>
                    <Link to={ROUTES.home}>{copy.successAction}</Link>
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
                onSubmit={form.submit}
            >
                <PasswordField
                    id="new-password"
                    label={copy.password}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={form.setPassword}
                    minLength={8}
                    disabled={form.isSubmitting}
                />
                <PasswordField
                    id="confirm-password"
                    label={copy.confirm}
                    autoComplete="new-password"
                    value={form.confirmation}
                    onChange={form.setConfirmation}
                    minLength={8}
                    disabled={form.isSubmitting}
                />

                {form.error && (
                    <p
                        className={styles.authError}
                        role="alert"
                    >
                        {form.error}
                    </p>
                )}

                <button
                    className={`button button--primary ${styles.authSubmit}`}
                    type="submit"
                    disabled={form.isSubmitting}
                >
                    {form.isSubmitting ? copy.submitting : copy.submit}
                </button>
            </form>
        </AuthCard>
    );
};

export default UpdatePassword;
