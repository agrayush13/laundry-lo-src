import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { STORAGE_KEYS } from '../config/commonConfig';
import { THEMES, Theme } from '../config/themeConfig';

interface ThemeContextValue {
    /** The user's explicit choice, or `system` when they haven't made one. */
    preference: Theme;
    /** What is actually on screen once the OS preference is resolved. */
    resolved: 'light' | 'dark';
    setPreference: (theme: Theme) => void;
    toggle: () => void;
}

const prefersDark = () =>
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;

const readStoredPreference = (): Theme => {
    try {
        const stored = window.localStorage.getItem(STORAGE_KEYS.theme);
        return stored && THEMES.includes(stored as Theme) ? (stored as Theme) : 'system';
    } catch {
        return 'system';
    }
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [preference, setPreferenceState] = useState<Theme>(readStoredPreference);
    const [systemIsDark, setSystemIsDark] = useState(prefersDark);

    // Follow the OS while the user has no explicit preference.
    useEffect(() => {
        const query = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = (event: MediaQueryListEvent) => setSystemIsDark(event.matches);

        query.addEventListener('change', onChange);
        return () => query.removeEventListener('change', onChange);
    }, []);

    const resolved = preference === 'system' ? (systemIsDark ? 'dark' : 'light') : preference;

    // The stylesheet keys off this attribute; `system` leaves it off so the
    // media query decides.
    useEffect(() => {
        const root = document.documentElement;

        if (preference === 'system') {
            root.removeAttribute('data-theme');
        } else {
            root.setAttribute('data-theme', preference);
        }
    }, [preference]);

    const setPreference = useCallback((theme: Theme) => {
        setPreferenceState(theme);
        try {
            if (theme === 'system') {
                window.localStorage.removeItem(STORAGE_KEYS.theme);
            } else {
                window.localStorage.setItem(STORAGE_KEYS.theme, theme);
            }
        } catch {
            // Storage can be unavailable in private browsing; the theme still applies.
        }
    }, []);

    const value = useMemo<ThemeContextValue>(
        () => ({
            preference,
            resolved,
            setPreference,
            toggle: () => setPreference(resolved === 'dark' ? 'light' : 'dark'),
        }),
        [preference, resolved, setPreference]
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
