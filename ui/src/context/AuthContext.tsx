import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { User } from '../data/user';
import {
    authService,
    type AuthIdentity,
    type AuthService,
    type IdentityChanges,
    type SignInDetails,
    type SignUpDetails,
} from '../services/authServices';
import { setAuthAccessToken } from '../services/authToken';
import {
    createAddress as createSavedAddress,
    getAddresses,
    getProfile,
    updateProfile,
    updateAddress as updateSavedAddress,
    type Profile,
} from '../services/customerServices';
import { readStoredProfile, writeStoredProfile } from '../services/profileStorage';
import { clearApiCache } from '../utils/serviceWorkerUtils';

const DEFAULT_PREFERENCES: User['preferences'] = { sms: true, email: false };

const textMetadata = (identity: AuthIdentity, ...keys: string[]) => {
    for (const key of keys) {
        const value = identity.metadata[key];
        if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return '';
};

const displayName = (identity: AuthIdentity) =>
    textMetadata(identity, 'full_name', 'name') ||
    identity.email.split('@')[0] ||
    identity.phone ||
    'Customer';

const toUser = (identity: AuthIdentity, current: User | null): User => {
    const sameUser = current?.id === identity.id ? current : null;
    const storedProfile = sameUser ? null : readStoredProfile(identity.id);
    return {
        id: identity.id,
        fullName: displayName(identity),
        email: identity.email,
        phone: identity.phone,
        memberSince: identity.createdAt,
        addresses:
            sameUser?.addresses ?? storedProfile?.addresses ?? identity.profile?.addresses ?? [],
        preferences:
            sameUser?.preferences ??
            storedProfile?.preferences ??
            identity.profile?.preferences ??
            DEFAULT_PREFERENCES,
    };
};

const toApiUser = (profile: Profile, addresses: User['addresses']): User => ({
    ...profile,
    addresses,
});

interface AuthContextValue {
    user: User | null;
    isLoading: boolean;
    isPasswordRecovery: boolean;
    /** True only for the production adapter whose customer data lives in the API. */
    isApiBacked: boolean;
    signIn: (details: SignInDetails) => Promise<void>;
    signUp: (details: SignUpDetails) => Promise<{ requiresEmailConfirmation: boolean }>;
    signInWithGoogle: (redirectTo: string) => Promise<void>;
    requestPasswordReset: (email: string, redirectTo: string) => Promise<void>;
    updatePassword: (password: string) => Promise<void>;
    signOut: () => Promise<void>;
    updateUser: (
        changes: Partial<Omit<User, 'id' | 'memberSince'>>
    ) => Promise<{ emailConfirmationRequired: boolean }>;
    addAddress: (address: Omit<User['addresses'][number], 'id'>) => Promise<void>;
    editAddress: (
        id: string,
        changes: Partial<Omit<User['addresses'][number], 'id'>>
    ) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
    children: React.ReactNode;
    service?: AuthService;
    /** Test adapters can opt into the production profile transport explicitly. */
    profileSource?: 'api' | 'embedded';
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
    children,
    service = authService,
    profileSource,
}) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

    const usesApiProfile = profileSource ? profileSource === 'api' : service === authService;

    const applySession = useCallback(
        async (session: Awaited<ReturnType<AuthService['signIn']>> | null) => {
            setAuthAccessToken(session?.accessToken ?? null);
            if (!session) {
                setUser(null);
                return;
            }

            // Render a safe identity-derived shell immediately. Production then
            // replaces it with the app profile and addresses owned by the API.
            setUser((current) => toUser(session.identity, current));
            if (!usesApiProfile) return;

            try {
                const [profile, addresses] = await Promise.all([getProfile(), getAddresses()]);
                setUser((current) =>
                    current?.id === session.identity.id ? toApiUser(profile, addresses) : current
                );
            } catch {
                // The authenticated identity remains usable during an API
                // outage; account screens can retry their own data later.
            }
        },
        [usesApiProfile]
    );

    useEffect(() => {
        const unsubscribe = service.subscribe((event, session) => {
            void applySession(session)
                .catch(() => undefined)
                .finally(() => setIsLoading(false));

            if (event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true);
            if (event === 'SIGNED_OUT') setIsPasswordRecovery(false);

            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
                void clearApiCache();
            }
        });

        return () => {
            unsubscribe();
            setAuthAccessToken(null);
        };
    }, [applySession, service]);

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            isLoading,
            isPasswordRecovery,
            isApiBacked: usesApiProfile,
            signIn: async (details) => {
                await applySession(await service.signIn(details));
                void clearApiCache();
            },
            signUp: async (details) => {
                const result = await service.signUp(details);
                if (result.session) {
                    await applySession(result.session);
                    void clearApiCache();
                }
                return { requiresEmailConfirmation: result.requiresEmailConfirmation };
            },
            signInWithGoogle: (redirectTo) => service.signInWithGoogle(redirectTo),
            requestPasswordReset: (email, redirectTo) =>
                service.requestPasswordReset(email, redirectTo),
            updatePassword: (password) => service.updatePassword(password),
            signOut: async () => {
                await service.signOut();
                await applySession(null);
                setIsPasswordRecovery(false);
                void clearApiCache();
            },
            updateUser: async (changes) => {
                if (!user) return { emailConfirmationRequired: false };

                const identityChanges: IdentityChanges = {};
                if (changes.fullName !== undefined && changes.fullName !== user.fullName) {
                    identityChanges.fullName = changes.fullName;
                }
                if (changes.email !== undefined && changes.email !== user.email) {
                    identityChanges.email = changes.email;
                }
                if (changes.phone !== undefined && changes.phone !== user.phone) {
                    identityChanges.phone = changes.phone;
                }

                const appChanges = {
                    ...(changes.fullName !== undefined ? { fullName: changes.fullName } : {}),
                    ...(changes.phone !== undefined ? { phone: changes.phone } : {}),
                    ...(changes.addresses !== undefined ? { addresses: changes.addresses } : {}),
                    ...(changes.preferences !== undefined
                        ? { preferences: changes.preferences }
                        : {}),
                };

                let identity = null;
                let emailConfirmationRequired = false;

                if (Object.keys(identityChanges).length > 0) {
                    const result = await service.updateIdentity(identityChanges);
                    identity = result.identity;
                    emailConfirmationRequired = result.emailConfirmationRequired;
                }

                if (usesApiProfile) {
                    const profileChanges = {
                        ...(changes.fullName !== undefined ? { fullName: changes.fullName } : {}),
                        ...(changes.phone !== undefined ? { phone: changes.phone } : {}),
                        ...(changes.preferences !== undefined
                            ? { preferences: changes.preferences }
                            : {}),
                    };
                    const profile =
                        Object.keys(profileChanges).length > 0
                            ? await updateProfile(profileChanges)
                            : null;
                    setUser((current) => {
                        if (!current) return null;
                        const withIdentity = identity ? toUser(identity, current) : current;
                        return profile
                            ? { ...withIdentity, ...profile, addresses: current.addresses }
                            : withIdentity;
                    });
                    return { emailConfirmationRequired };
                }

                setUser((current) => {
                    if (!current) return null;
                    const withIdentity = identity ? toUser(identity, current) : current;
                    const next = { ...withIdentity, ...appChanges };
                    writeStoredProfile(next);
                    return next;
                });
                return { emailConfirmationRequired };
            },
            addAddress: async (address) => {
                if (!user) return;
                if (usesApiProfile) {
                    const saved = await createSavedAddress(address);
                    setUser((current) =>
                        current ? { ...current, addresses: [...current.addresses, saved] } : null
                    );
                    return;
                }

                setUser((current) => {
                    if (!current) return null;
                    const saved = {
                        ...address,
                        id: `${address.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
                    };
                    const next = { ...current, addresses: [...current.addresses, saved] };
                    writeStoredProfile(next);
                    return next;
                });
            },
            editAddress: async (id, changes) => {
                if (!user) return;
                if (usesApiProfile) {
                    const saved = await updateSavedAddress(id, changes);
                    setUser((current) =>
                        current
                            ? {
                                  ...current,
                                  addresses: current.addresses.map((address) =>
                                      address.id === id ? saved : address
                                  ),
                              }
                            : null
                    );
                    return;
                }

                setUser((current) => {
                    if (!current) return null;
                    const next = {
                        ...current,
                        addresses: current.addresses.map((address) =>
                            address.id === id ? { ...address, ...changes } : address
                        ),
                    };
                    writeStoredProfile(next);
                    return next;
                });
            },
        }),
        [applySession, isLoading, isPasswordRecovery, service, user, usesApiProfile]
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
