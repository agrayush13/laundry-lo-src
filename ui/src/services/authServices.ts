import type {
    AuthChangeEvent,
    AuthError,
    Session,
    SupabaseClient,
    User as SupabaseUser,
} from '@supabase/supabase-js';
import type { User } from '../data/user';

export interface AuthIdentity {
    id: string;
    email: string;
    phone: string;
    createdAt: string;
    metadata: Record<string, unknown>;
    /** Test adapters may provide an app profile; production identity never does. */
    profile?: User;
}

export interface AuthSession {
    accessToken: string;
    identity: AuthIdentity;
}

export type AuthEvent = AuthChangeEvent;

export interface SignInDetails {
    email: string;
    password: string;
}

export interface SignUpDetails {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    emailRedirectTo: string;
}

export interface IdentityChanges {
    fullName?: string;
    email?: string;
    phone?: string;
}

export interface IdentityUpdateResult {
    identity: AuthIdentity;
    emailConfirmationRequired: boolean;
}

export interface AuthService {
    subscribe: (listener: (event: AuthEvent, session: AuthSession | null) => void) => () => void;
    signIn: (details: SignInDetails) => Promise<AuthSession>;
    signUp: (
        details: SignUpDetails
    ) => Promise<{ session: AuthSession | null; requiresEmailConfirmation: boolean }>;
    signInWithGoogle: (redirectTo: string) => Promise<void>;
    requestPasswordReset: (email: string, redirectTo: string) => Promise<void>;
    updatePassword: (password: string) => Promise<void>;
    updateIdentity: (changes: IdentityChanges) => Promise<IdentityUpdateResult>;
    signOut: () => Promise<void>;
}

export type AuthFailureCode =
    | 'NOT_CONFIGURED'
    | 'INVALID_CREDENTIALS'
    | 'EMAIL_NOT_CONFIRMED'
    | 'WEAK_PASSWORD'
    | 'RATE_LIMITED'
    | 'PROVIDER_DISABLED'
    | 'INVALID_PHONE'
    | 'NETWORK_ERROR'
    | 'UNKNOWN';

export class AuthFailure extends Error {
    constructor(
        readonly code: AuthFailureCode,
        message: string
    ) {
        super(message);
        this.name = 'AuthFailure';
    }
}

const FAILURE_MESSAGES: Record<AuthFailureCode, string> = {
    NOT_CONFIGURED: 'Authentication is not configured for this environment.',
    INVALID_CREDENTIALS: 'The email or password is incorrect.',
    EMAIL_NOT_CONFIRMED: 'Confirm your email before signing in.',
    WEAK_PASSWORD: 'Use a stronger password with at least eight characters.',
    RATE_LIMITED: 'Too many attempts. Wait a moment and try again.',
    PROVIDER_DISABLED: 'That sign-in method is not enabled yet.',
    INVALID_PHONE: 'Enter a valid phone number with its country code.',
    NETWORK_ERROR: 'Authentication could not be reached. Check your connection and try again.',
    UNKNOWN: 'Authentication failed. Please try again.',
};

const failure = (code: AuthFailureCode) => new AuthFailure(code, FAILURE_MESSAGES[code]);

const codeOf = (error: AuthError | Error): string =>
    'code' in error && typeof error.code === 'string' ? error.code : '';

const normalizeFailure = (error: unknown): AuthFailure => {
    if (error instanceof AuthFailure) return error;

    if (error instanceof Error) {
        const code = codeOf(error);
        if (code === 'invalid_credentials') return failure('INVALID_CREDENTIALS');
        if (code === 'email_not_confirmed') return failure('EMAIL_NOT_CONFIRMED');
        if (code === 'weak_password') return failure('WEAK_PASSWORD');
        if (code.includes('rate_limit')) return failure('RATE_LIMITED');
        if (code.includes('provider_disabled')) return failure('PROVIDER_DISABLED');
        if (error.name === 'AuthRetryableFetchError' || error.name === 'TypeError') {
            return failure('NETWORK_ERROR');
        }
    }

    return failure('UNKNOWN');
};

export const authFailureMessage = (error: unknown) => normalizeFailure(error).message;

const normalizePhone = (phone: string): string => {
    const compact = phone.replace(/[\s()-]/g, '');
    const international = /^\d{10}$/.test(compact) ? `+91${compact}` : compact;
    if (!/^\+[1-9]\d{7,14}$/.test(international)) {
        throw failure('INVALID_PHONE');
    }
    return international;
};

const toIdentity = (user: SupabaseUser): AuthIdentity => ({
    id: user.id,
    email: user.email ?? '',
    phone:
        user.phone?.trim() ||
        (typeof user.user_metadata['phone'] === 'string' ? user.user_metadata['phone'] : ''),
    createdAt: user.created_at,
    metadata: user.user_metadata,
});

const toSession = (session: Session | null): AuthSession | null =>
    session ? { accessToken: session.access_token, identity: toIdentity(session.user) } : null;

const hasHttpUrl = (value: string) => {
    try {
        return ['http:', 'https:'].includes(new URL(value).protocol);
    } catch {
        return false;
    }
};

const supabaseUrl = typeof __SUPABASE_URL__ === 'undefined' ? '' : __SUPABASE_URL__;
const supabasePublishableKey =
    typeof __SUPABASE_PUBLISHABLE_KEY__ === 'undefined' ? '' : __SUPABASE_PUBLISHABLE_KEY__;

export const isAuthConfigured = hasHttpUrl(supabaseUrl) && supabasePublishableKey.trim().length > 0;

let clientPromise: Promise<SupabaseClient> | null = null;

const requireClient = async () => {
    if (!isAuthConfigured) throw failure('NOT_CONFIGURED');

    clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
        createClient(supabaseUrl, supabasePublishableKey, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true,
                // Authorization codes are short-lived and single-use. Unlike
                // the implicit flow, PKCE never puts access and refresh tokens
                // in the callback URL.
                flowType: 'pkce',
            },
        })
    );
    return clientPromise;
};

const attempt = async <T>(action: () => Promise<T>): Promise<T> => {
    try {
        return await action();
    } catch (error) {
        throw normalizeFailure(error);
    }
};

/** Injectable factory keeps the production Supabase adapter independently testable. */
export const createAuthService = (
    getClient: () => Promise<SupabaseClient>,
    configured = true
): AuthService => ({
    subscribe: (listener) => {
        if (!configured) {
            queueMicrotask(() => listener('INITIAL_SESSION', null));
            return () => {};
        }

        let isClosed = false;
        let unsubscribe = () => {};
        void getClient()
            .then((client) => {
                if (isClosed) return;
                const {
                    data: { subscription },
                } = client.auth.onAuthStateChange((event, session) =>
                    listener(event, toSession(session))
                );
                unsubscribe = () => subscription.unsubscribe();
            })
            .catch(() => {
                if (!isClosed) listener('INITIAL_SESSION', null);
            });

        return () => {
            isClosed = true;
            unsubscribe();
        };
    },

    signIn: (details) =>
        attempt(async () => {
            const client = await getClient();
            const { data, error } = await client.auth.signInWithPassword({
                email: details.email.trim(),
                password: details.password,
            });
            if (error) throw error;
            const session = toSession(data.session);
            if (!session) throw failure('UNKNOWN');
            return session;
        }),

    signUp: (details) =>
        attempt(async () => {
            const client = await getClient();
            const { data, error } = await client.auth.signUp({
                email: details.email.trim(),
                password: details.password,
                options: {
                    emailRedirectTo: details.emailRedirectTo,
                    data: {
                        full_name: details.fullName.trim(),
                        phone: normalizePhone(details.phone),
                    },
                },
            });
            if (error) throw error;
            const session = toSession(data.session);
            return { session, requiresEmailConfirmation: session === null };
        }),

    signInWithGoogle: (redirectTo) =>
        attempt(async () => {
            const client = await getClient();
            const { error } = await client.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo },
            });
            if (error) throw error;
        }),

    requestPasswordReset: (email, redirectTo) =>
        attempt(async () => {
            const client = await getClient();
            const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
                redirectTo,
            });
            if (error) throw error;
        }),

    updatePassword: (password) =>
        attempt(async () => {
            const client = await getClient();
            const { error } = await client.auth.updateUser({ password });
            if (error) throw error;
        }),

    updateIdentity: (changes) =>
        attempt(async () => {
            const attributes: {
                email?: string;
                data?: Record<string, string>;
            } = {};

            if (changes.email !== undefined) attributes.email = changes.email.trim();
            if (changes.fullName !== undefined || changes.phone !== undefined) {
                attributes.data = {
                    ...(changes.fullName !== undefined
                        ? { full_name: changes.fullName.trim() }
                        : {}),
                    ...(changes.phone !== undefined
                        ? { phone: normalizePhone(changes.phone) }
                        : {}),
                };
            }

            const client = await getClient();
            const { data, error } = await client.auth.updateUser(attributes);
            if (error) throw error;
            return {
                identity: toIdentity(data.user),
                emailConfirmationRequired: Boolean(data.user.new_email),
            };
        }),

    signOut: () =>
        attempt(async () => {
            const client = await getClient();
            // A normal sign-out should affect this browser session, not every
            // device on which the customer is currently signed in.
            const { error } = await client.auth.signOut({ scope: 'local' });
            if (error) throw error;
        }),
});

export const authService: AuthService = createAuthService(requireClient, isAuthConfigured);
