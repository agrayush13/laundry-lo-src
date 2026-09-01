import type { AuthChangeEvent, Session, SupabaseClient, User } from '@supabase/supabase-js';
import { authFailureMessage, createAuthService } from '../services/authServices';

const ID = '00000000-0000-4000-8000-000000000001';

const identity = (changes: Partial<User> = {}) =>
    ({
        id: ID,
        email: 'customer@example.com',
        phone: '',
        created_at: '2026-08-31T12:00:00.000Z',
        user_metadata: { full_name: 'Test Customer', phone: '+919876500000' },
        ...changes,
    }) as User;

const session = (user = identity()) => ({ access_token: 'signed-access-token', user }) as Session;

const adapter = (auth: Record<string, unknown>) =>
    createAuthService(async () => ({ auth }) as unknown as SupabaseClient);

describe('production auth service adapter', () => {
    it('signs in with normalized email and returns only the session data the app needs', async () => {
        const signInWithPassword = vi.fn().mockResolvedValue({
            data: { session: session() },
            error: null,
        });
        const service = adapter({ signInWithPassword });

        await expect(
            service.signIn({ email: '  customer@example.com ', password: 'password1' })
        ).resolves.toEqual({
            accessToken: 'signed-access-token',
            identity: {
                id: ID,
                email: 'customer@example.com',
                phone: '+919876500000',
                createdAt: '2026-08-31T12:00:00.000Z',
                metadata: { full_name: 'Test Customer', phone: '+919876500000' },
            },
        });
        expect(signInWithPassword).toHaveBeenCalledWith({
            email: 'customer@example.com',
            password: 'password1',
        });
    });

    it('normalizes signup identity data and reports when confirmation is required', async () => {
        const signUp = vi.fn().mockResolvedValue({ data: { session: null }, error: null });
        const service = adapter({ signUp });

        await expect(
            service.signUp({
                fullName: '  Test Customer ',
                email: ' customer@example.com ',
                phone: '98765 00000',
                password: 'password1',
                emailRedirectTo: 'https://laundrylo.com/auth/callback',
            })
        ).resolves.toEqual({ session: null, requiresEmailConfirmation: true });
        expect(signUp).toHaveBeenCalledWith({
            email: 'customer@example.com',
            password: 'password1',
            options: {
                emailRedirectTo: 'https://laundrylo.com/auth/callback',
                data: { full_name: 'Test Customer', phone: '+919876500000' },
            },
        });
    });

    it('starts Google and recovery flows and signs out only the current session', async () => {
        const signInWithOAuth = vi.fn().mockResolvedValue({ error: null });
        const resetPasswordForEmail = vi.fn().mockResolvedValue({ error: null });
        const signOut = vi.fn().mockResolvedValue({ error: null });
        const service = adapter({ signInWithOAuth, resetPasswordForEmail, signOut });

        await service.signInWithGoogle('https://laundrylo.com/auth/callback?next=%2Fbookings');
        await service.requestPasswordReset(
            ' customer@example.com ',
            'https://laundrylo.com/update-password'
        );
        await service.signOut();

        expect(signInWithOAuth).toHaveBeenCalledWith({
            provider: 'google',
            options: { redirectTo: 'https://laundrylo.com/auth/callback?next=%2Fbookings' },
        });
        expect(resetPasswordForEmail).toHaveBeenCalledWith('customer@example.com', {
            redirectTo: 'https://laundrylo.com/update-password',
        });
        expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
    });

    it('adapts identity updates and never exposes provider error details to the UI', async () => {
        const updated = identity({
            new_email: 'new@example.com',
            user_metadata: { full_name: 'New Name', phone: '+919000000000' },
        });
        const updateUser = vi
            .fn()
            .mockResolvedValueOnce({ data: { user: updated }, error: null })
            .mockResolvedValueOnce({
                data: { user: null },
                error: Object.assign(new Error('Provider internals'), {
                    code: 'invalid_credentials',
                }),
            });
        const service = adapter({ updateUser });

        await expect(
            service.updateIdentity({ fullName: 'New Name', phone: '+91 90000 00000' })
        ).resolves.toMatchObject({
            identity: { id: ID, phone: '+919000000000' },
            emailConfirmationRequired: true,
        });
        let passwordFailure: unknown;
        try {
            await service.updatePassword('password2');
        } catch (error) {
            passwordFailure = error;
        }
        expect(passwordFailure).toMatchObject({ code: 'INVALID_CREDENTIALS' });
        expect(authFailureMessage(passwordFailure)).toBe('The email or password is incorrect.');
    });

    it('forwards auth events and releases the Supabase subscription', async () => {
        let notify: ((event: AuthChangeEvent, session: Session | null) => void) | undefined;
        const unsubscribe = vi.fn();
        const onAuthStateChange = vi.fn((listener) => {
            notify = listener;
            return { data: { subscription: { unsubscribe } } };
        });
        const service = adapter({ onAuthStateChange });
        const listener = vi.fn();
        const stop = service.subscribe(listener);

        await vi.waitFor(() => expect(onAuthStateChange).toHaveBeenCalledOnce());
        notify?.('TOKEN_REFRESHED', session());
        expect(listener).toHaveBeenCalledWith(
            'TOKEN_REFRESHED',
            expect.objectContaining({ accessToken: 'signed-access-token' })
        );

        stop();
        expect(unsubscribe).toHaveBeenCalledOnce();
    });
});
