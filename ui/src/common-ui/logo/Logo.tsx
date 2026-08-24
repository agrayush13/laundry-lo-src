import React, { useId } from 'react';
import appIcon from '../../assets/laundrylo-appicon-v2.svg';
import { BRAND } from '../../config/brandConfig';
import styles from './logo.module.scss';

export type LogoSize = 'sm' | 'md' | 'lg';

interface LogoProps {
    /** `wordmark` for navigation and footers, `icon` where space is tight. */
    variant?: 'wordmark' | 'icon';
    size?: LogoSize;
    className?: string;
}

const Logo: React.FC<LogoProps> = ({ variant = 'wordmark', size = 'md', className }) => {
    // Several logos can share a page, so the clip path needs a unique id.
    const clipId = useId();
    const sizeClass = { sm: styles.sizeSm, md: styles.sizeMd, lg: styles.sizeLg }[size];
    const classes = [styles.logo, variant === 'icon' && styles.icon, sizeClass, className]
        .filter(Boolean)
        .join(' ');

    if (variant === 'icon') {
        return (
            <img
                className={classes}
                src={appIcon}
                alt={BRAND.name}
            />
        );
    }

    // Ink is `currentColor` so the wordmark follows the theme; the drum keeps
    // its brand blue in both.
    return (
        <svg
            className={classes}
            viewBox="0 0 430 132"
            role="img"
            aria-label={BRAND.name}
        >
            <clipPath id={clipId}>
                <circle
                    cx="374"
                    cy="70"
                    r="24"
                />
            </clipPath>
            <text
                x="0"
                y="100"
                className={styles.wordmarkText}
                fill="currentColor"
            >
                laundryl
            </text>
            <circle
                cx="374"
                cy="70"
                r="27.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="8.5"
            />
            <g clipPath={`url(#${clipId})`}>
                <path
                    className={styles.water}
                    d="M350 72 C 360 66, 367 66, 374 71 C 382 77, 389 77, 398 71 L 398 96 L 350 96 Z"
                />
            </g>
            <circle
                className={styles.dot}
                cx="415"
                cy="98"
                r="6"
            />
        </svg>
    );
};

export default Logo;
