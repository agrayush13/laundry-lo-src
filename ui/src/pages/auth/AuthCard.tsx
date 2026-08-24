import React from 'react';
import BackLink from '../../common-ui/back-link/BackLink';
import Logo from '../../common-ui/logo/Logo';
import { AUTH_COPY } from '../../config/authConfig';
import { ROUTES } from '../../config/navigationConfig';
import styles from './auth.module.scss';

interface AuthCardProps {
    title: string;
    subtitle: string;
    children: React.ReactNode;
}

const AuthCard: React.FC<AuthCardProps> = ({ title, subtitle, children }) => (
    <div className={styles.auth}>
        <BackLink
            label={AUTH_COPY.back}
            to={ROUTES.home}
        />

        <div className={`card ${styles.authCard}`}>
            <Logo
                variant="icon"
                className={styles.authLogo}
            />
            <h1 className={styles.authTitle}>{title}</h1>
            <p className={styles.authSubtitle}>{subtitle}</p>
            {children}
        </div>
    </div>
);

export default AuthCard;
