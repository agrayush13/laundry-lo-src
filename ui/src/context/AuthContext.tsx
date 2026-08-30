import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { MOCK_USER, User } from '../data/user';
import { STORAGE_KEYS } from '../config/commonConfig';
import { clearApiCache } from '../utils/serviceWorkerUtils';

const STORAGE_VERSION = 1;

interface StoredUser {
    version: number;
    user: User;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const isUser = (value: unknown): value is User => {
    if (!isRecord(value)) return false;

    const preferences = value['preferences'];
    const addresses = value['addresses'];
    return (
        typeof value['fullName'] === 'string' &&
        typeof value['email'] === 'string' &&
        typeof value['phone'] === 'string' &&
        typeof value['memberSince'] === 'string' &&
        Array.isArray(addresses) &&
        addresses.every(
            (address) =>
                isRecord(address) &&
                [
                    'id',
                    'label',
                    'recipientName',
                    'phone',
                    'building',
                    'street',
                    'landmark',
                    'pincode',
                ].every((field) => typeof address[field] === 'string')
        ) &&
        isRecord(preferences) &&
        typeof preferences['sms'] === 'boolean' &&
        typeof preferences['email'] === 'boolean'
    );
};

interface AuthContextValue {
    user: User | null;
    signIn: (details: { method: 'email' | 'phone'; identifier: string }) => void;
    signUp: (details: { fullName: string; email: string; phone: string }) => void;
    signOut: () => void;
    updateUser: (changes: Partial<User>) => void;
}

const readStoredUser = (): User | null => {
    try {
        const stored = window.localStorage.getItem(STORAGE_KEYS.user);
        if (!stored) return null;

        const parsed: unknown = JSON.parse(stored);
        const candidate =
            isRecord(parsed) && parsed['version'] === STORAGE_VERSION ? parsed['user'] : parsed;
        return isUser(candidate) ? candidate : null;
    } catch {
        return null;
    }
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(readStoredUser);

    // Every identity change empties the API cache. The service worker keys
    // cached reads on the URL alone, so anything cached for one account would
    // otherwise be served to the next one on this device, and would survive
    // sign-out entirely.
    const persist = useCallback((next: User | null) => {
        void clearApiCache();
        setUser(next);
        try {
            if (next) {
                const stored: StoredUser = { version: STORAGE_VERSION, user: next };
                window.localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(stored));
            } else {
                window.localStorage.removeItem(STORAGE_KEYS.user);
            }
        } catch {
            // Storage can be unavailable in private browsing; the in-memory session still works.
        }
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            signIn: ({ method, identifier }) =>
                persist({
                    ...MOCK_USER,
                    ...(method === 'email' ? { email: identifier } : { phone: identifier }),
                }),
            signUp: ({ fullName, email, phone }) =>
                persist({ ...MOCK_USER, fullName, email, phone, addresses: [] }),
            signOut: () => persist(null),
            updateUser: (changes) => persist(user ? { ...user, ...changes } : null),
        }),
        [user, persist]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
