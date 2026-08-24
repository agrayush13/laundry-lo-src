import React from 'react';
import { Link } from 'react-router-dom';
import { ICON_SIZE } from '../../config/brandConfig';
import Icon from '../icons/Icon';
import styles from './backLink.module.scss';

interface BackLinkProps {
    label: string;
    /** Omit to render a button that calls `onClick` instead of navigating. */
    to?: string;
    spacing?: 'md' | 'lg';
    /** `onImage` sits over artwork and needs light text. */
    tone?: 'default' | 'onImage';
    onClick?: () => void;
}

const BackLink: React.FC<BackLinkProps> = ({
    label,
    to,
    spacing = 'md',
    tone = 'default',
    onClick,
}) => {
    const content = (
        <>
            <Icon
                name="arrow-left"
                size={ICON_SIZE.md}
            />
            {label}
        </>
    );

    if (to) {
        return (
            <Link
                className={styles.backLink}
                to={to}
                data-spacing={spacing}
                data-tone={tone}
            >
                {content}
            </Link>
        );
    }

    return (
        <button
            className={styles.backLink}
            type="button"
            data-spacing={spacing}
            data-tone={tone}
            onClick={onClick}
        >
            {content}
        </button>
    );
};

export default BackLink;
