import { MOCK_USER, type User } from '../data/user';
import {
    type AuthEvent,
    type AuthIdentity,
    type AuthService,
    type AuthSession,
    type IdentityChanges,
} from '../services/authServices';

const identityFrom = (user: User): AuthIdentity => ({
    id: user.id,
    email: user.email,
    phone: user.phone,
    createdAt: user.memberSince,
    metadata: { full_name: user.fullName, phone: user.phone },
    profile: user,
});

const sessionFrom = (user: User): AuthSession => ({
    accessToken: 'test-access-token',
    identity: identityFrom(user),
});

class FakeAuthService implements AuthService {
    private session: AuthSession | null = null;
    private initialEvent: AuthEvent = 'INITIAL_SESSION';
    private listeners = new Set<(event: AuthEvent, session: AuthSession | null) => void>();

    googleRedirectTo: string | null = null;
    passwordReset: { email: string; redirectTo: string } | null = null;
    updatedPassword: string | null = null;
    confirmationRequired = false;

    reset() {
        this.session = null;
        this.initialEvent = 'INITIAL_SESSION';
        this.googleRedirectTo = null;
        this.passwordReset = null;
        this.updatedPassword = null;
        this.confirmationRequired = false;
    }

    authenticate(user: User = MOCK_USER) {
        this.session = sessionFrom(user);
    }

    recover(user: User = MOCK_USER) {
        this.session = sessionFrom(user);
        this.initialEvent = 'PASSWORD_RECOVERY';
    }

    private emit(event: AuthEvent) {
        for (const listener of this.listeners) listener(event, this.session);
    }

    subscribe(listener: (event: AuthEvent, session: AuthSession | null) => void) {
        this.listeners.add(listener);
        queueMicrotask(() => listener(this.initialEvent, this.session));
        return () => this.listeners.delete(listener);
    }

    async signIn(details: Parameters<AuthService['signIn']>[0]) {
        const user = {
            ...MOCK_USER,
            email: details.email,
        };
        this.session = sessionFrom(user);
        this.emit('SIGNED_IN');
        return this.session;
    }

    async signUp(details: Parameters<AuthService['signUp']>[0]) {
        if (this.confirmationRequired) {
            return { session: null, requiresEmailConfirmation: true };
        }
        this.session = sessionFrom({
            ...MOCK_USER,
            id: '00000000-0000-4000-8000-000000000002',
            fullName: details.fullName,
            email: details.email,
            phone: details.phone,
            addresses: [],
        });
        this.emit('SIGNED_IN');
        return { session: this.session, requiresEmailConfirmation: false };
    }

    async signInWithGoogle(redirectTo: string) {
        this.googleRedirectTo = redirectTo;
    }

    async requestPasswordReset(email: string, redirectTo: string) {
        this.passwordReset = { email, redirectTo };
    }

    async updatePassword(password: string) {
        this.updatedPassword = password;
    }

    async updateIdentity(changes: IdentityChanges) {
        if (!this.session) throw new Error('No test session');
        const current = this.session.identity;
        const metadata = {
            ...current.metadata,
            ...(changes.fullName !== undefined ? { full_name: changes.fullName } : {}),
            ...(changes.phone !== undefined ? { phone: changes.phone } : {}),
        };
        const identity: AuthIdentity = {
            ...current,
            email: changes.email ?? current.email,
            phone: changes.phone ?? current.phone,
            metadata,
        };
        this.session = { ...this.session, identity };
        this.emit('USER_UPDATED');
        return { identity, emailConfirmationRequired: false };
    }

    async signOut() {
        this.session = null;
        this.emit('SIGNED_OUT');
    }
}

export const fakeAuthService = new FakeAuthService();
