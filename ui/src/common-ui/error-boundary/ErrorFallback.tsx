import React from 'react';
import { Link } from 'react-router-dom';
import { ICON_SIZE } from '../../config/brandConfig';
import { ERROR_COPY } from '../../config/commonConfig';
import { ROUTES } from '../../config/navigationConfig';
import Icon from '../icons/Icon';
import styles from './errorFallback.module.scss';

interface ErrorFallbackProps {
    onRetry: () => void;
    /** Full-page errors lose the header, so they offer a route home. */
    variant?: 'page' | 'app';
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ onRetry, variant = 'page' }) => (
    <div
        className={styles.error}
        role="alert"
    >
        <span className={styles.errorIcon}>
            <Icon
                name="alert"
                size={ICON_SIZE.hero}
            />
        </span>
        <h1 className={styles.errorTitle}>{ERROR_COPY.title}</h1>
        <p className={styles.errorBody}>{ERROR_COPY.body}</p>

        <div className={styles.errorActions}>
            <button
                className="button button--primary"
                type="button"
                onClick={onRetry}
            >
                {ERROR_COPY.retry}
            </button>
            {variant === 'app' ? (
                <button
                    className={`button ${styles.errorSecondary}`}
                    type="button"
                    onClick={() => window.location.reload()}
                >
                    {ERROR_COPY.reload}
                </button>
            ) : (
                <Link
                    className={`button ${styles.errorSecondary}`}
                    to={ROUTES.home}
                >
                    {ERROR_COPY.home}
                </Link>
            )}
        </div>
    </div>
);

export default ErrorFallback;
