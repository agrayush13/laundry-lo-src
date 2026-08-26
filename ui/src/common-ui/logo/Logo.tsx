import React, { useId } from 'react';
import appIcon from '../../assets/laundrylo-appicon-v2.svg';
import { BRAND } from '../../config/brandConfig';
import { WORDMARK } from './wordmark';
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

    // Drawn from the lockup's own outlines rather than typeset: the final "o" is
    // a drum, and no font has that letter.
    return (
        <svg
            className={classes}
            viewBox={WORDMARK.viewBox}
            role="img"
            aria-label={BRAND.name}
        >
            <g
                transform={WORDMARK.transform}
                fill="currentColor"
            >
                {WORDMARK.letters.map((d) => (
                    <path
                        d={d}
                        key={d.slice(0, 24)}
                    />
                ))}

                <circle
                    cx={WORDMARK.drum.cx}
                    cy={WORDMARK.drum.cy}
                    r={WORDMARK.drum.r}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={WORDMARK.drum.stroke}
                />
                <clipPath id={clipId}>
                    <circle
                        cx={WORDMARK.drum.cx}
                        cy={WORDMARK.drum.cy}
                        r={WORDMARK.drum.inner}
                    />
                </clipPath>
                <g clipPath={`url(#${clipId})`}>
                    <path
                        className={styles.water}
                        d={WORDMARK.water}
                    />
                </g>
                <circle
                    className={styles.dot}
                    cx={WORDMARK.dot.cx}
                    cy={WORDMARK.dot.cy}
                    r={WORDMARK.dot.r}
                    fill="none"
                    strokeWidth={WORDMARK.dot.stroke}
                />
            </g>
        </svg>
    );
};

export default Logo;
