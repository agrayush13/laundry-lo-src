import { useEffect } from 'react';
import { Theme } from '../config/themeConfig';
import { useTheme } from '../context/ThemeContext';

/**
 * Holds the theme at one value while a page is mounted, and hands it back on the
 * way out. The visitor's stored preference is never touched, so leaving the page
 * returns them to whatever they had chosen.
 */
export const useThemeLock = (theme: Theme) => {
    const { lockTheme } = useTheme();

    useEffect(() => {
        lockTheme(theme);
        return () => lockTheme(null);
    }, [lockTheme, theme]);
};
