import React from 'react';
import Icon from '../../common-ui/icons/Icon';
import { AUTH_COPY } from '../../config/authConfig';
import { ICON_SIZE } from '../../config/brandConfig';
import { useToggle } from '../../hooks/useToggle';
import styles from './auth.module.scss';

interface PasswordFieldProps {
    id: string;
    label: string;
    value: string;
    autoComplete: string;
    onChange: (value: string) => void;
}

const PasswordField: React.FC<PasswordFieldProps> = ({
    id,
    label,
    value,
    autoComplete,
    onChange,
}) => {
    const { isOn: isVisible, toggle } = useToggle();

    return (
        <p className={`${styles.authField} ${styles.authFieldPassword}`}>
            <label htmlFor={id}>{label}</label>
            <input
                id={id}
                type={isVisible ? 'text' : 'password'}
                autoComplete={autoComplete}
                placeholder={AUTH_COPY.fields.password.placeholder}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                required
            />
            <button
                type="button"
                className={styles.authReveal}
                aria-label={
                    isVisible ? AUTH_COPY.passwordToggle.hide : AUTH_COPY.passwordToggle.show
                }
                onClick={toggle}
            >
                <Icon
                    name={isVisible ? 'eye-off' : 'eye'}
                    size={ICON_SIZE.md}
                />
            </button>
        </p>
    );
};

export default PasswordField;
