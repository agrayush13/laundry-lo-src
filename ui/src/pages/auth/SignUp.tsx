import React from 'react';
import { Link } from 'react-router-dom';
import { AUTH_COPY, SIGN_UP_FIELDS } from '../../config/authConfig';
import { ROUTES } from '../../config/navigationConfig';
import { useSignUpForm } from '../../hooks/useSignUpForm';
import AuthCard from './AuthCard';
import OAuthButton from './OAuthButton';
import PasswordField from './PasswordField';
import styles from './auth.module.scss';

const { signUp: copy, divider, fields } = AUTH_COPY;

const SignUp: React.FC = () => {
    const { fields: values, setField, submit } = useSignUpForm();

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
                />

                <button
                    className={`button button--primary ${styles.authSubmit}`}
                    type="submit"
                >
                    {copy.submit}
                </button>
            </form>

            <p className={styles.authSwitch}>
                {copy.switchPrompt} <Link to={ROUTES.signIn}>{copy.switchAction}</Link>
            </p>
        </AuthCard>
    );
};

export default SignUp;
