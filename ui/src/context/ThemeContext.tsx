import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { STORAGE_KEYS } from '../config/commonConfig';
import { THEMES, Theme } from '../config/themeConfig';

interface ThemeContextValue {
    /** The user's explicit choice, or `system` when they haven't made one. */
    preference: Theme;
    /** What is actually on screen once the OS preference is resolved. */
    resolved: 'light' | 'dark';
    /** True while a page holds the theme, which hides the toggle. */
    isLocked: boolean;
    setPreference: (theme: Theme) => void;
    toggle: () => void;
    /**
     * Pins the theme for as long as a page needs it, ignoring the preference
     * without overwriting it. The journey uses this: a dark wash cycle is not a
     * variant of that design, so it does not get one.
     */
    lockTheme: (theme: Theme | null) => void;
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
    const [lock, setLock] = useState<Theme | null>(null);

    // Follow the OS while the user has no explicit preference.
    useEffect(() => {
        const query = window.matchMedia?.('(prefers-color-scheme: dark)');
        if (!query) return undefined;

        const onChange = (event: MediaQueryListEvent) => setSystemIsDark(event.matches);

        query.addEventListener('change', onChange);
        return () => query.removeEventListener('change', onChange);
    }, []);

    // A lock wins over the preference while it is held, and releasing it puts
    // the visitor's own choice straight back.
    const active = lock ?? preference;
    const resolved = active === 'system' ? (systemIsDark ? 'dark' : 'light') : active;

    // The stylesheet keys off this attribute; `system` leaves it off so the
    // media query decides.
    useEffect(() => {
        const root = document.documentElement;

        if (active === 'system') {
            root.removeAttribute('data-theme');
        } else {
            root.setAttribute('data-theme', active);
        }
    }, [active]);

    // Browser chrome should follow the rendered palette rather than staying
    // light around a dark page.
    useEffect(() => {
        document
            .querySelector('meta[name="theme-color"]')
            ?.setAttribute('content', resolved === 'dark' ? '#1c1917' : '#f3ece0');
    }, [resolved]);

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
            isLocked: lock !== null,
            setPreference,
            toggle: () => setPreference(resolved === 'dark' ? 'light' : 'dark'),
            lockTheme: setLock,
        }),
        [lock, preference, resolved, setPreference]
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
