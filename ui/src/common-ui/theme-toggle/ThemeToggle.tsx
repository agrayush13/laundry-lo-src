import React from 'react';
import { ICON_SIZE } from '../../config/brandConfig';
import { THEME_COPY } from '../../config/themeConfig';
import { useTheme } from '../../context/ThemeContext';
import Icon from '../icons/Icon';
import styles from './themeToggle.module.scss';

const ThemeToggle: React.FC = () => {
    const { resolved, toggle, isLocked } = useTheme();
    const isDark = resolved === 'dark';

    // A page holding the theme would make this button lie, so it is not offered.
    if (isLocked) {
        return null;
    }

    return (
        <button
            className={styles.themeToggle}
            type="button"
            aria-label={isDark ? THEME_COPY.toLight : THEME_COPY.toDark}
            onClick={toggle}
        >
            <Icon
                name={isDark ? 'sun' : 'moon'}
                size={ICON_SIZE.lg}
            />
        </button>
    );
};

export default ThemeToggle;
