import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { MOCK_USER, User } from '../data/user';
import { STORAGE_KEYS } from '../config/commonConfig';

interface AuthContextValue {
    user: User | null;
    signIn: (email: string) => void;
    signUp: (details: { fullName: string; email: string; phone: string }) => void;
    signOut: () => void;
    updateUser: (changes: Partial<User>) => void;
}

const readStoredUser = (): User | null => {
    try {
        const stored = window.localStorage.getItem(STORAGE_KEYS.user);
        return stored ? (JSON.parse(stored) as User) : null;
    } catch {
        return null;
    }
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(readStoredUser);

    const persist = useCallback((next: User | null) => {
        setUser(next);
        if (next) {
            window.localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(next));
        } else {
            window.localStorage.removeItem(STORAGE_KEYS.user);
        }
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            signIn: (email) => persist({ ...MOCK_USER, email: email || MOCK_USER.email }),
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
