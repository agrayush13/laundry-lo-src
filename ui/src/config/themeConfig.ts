export const THEMES = ['light', 'dark', 'system'] as const;

export type Theme = (typeof THEMES)[number];

export const THEME_COPY = {
    toLight: 'Switch to light theme',
    toDark: 'Switch to dark theme',
} as const;
