import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import type { Config } from '../config.js';
import { ApiError } from '../http/errors.js';

/**
 * We do not issue tokens. Supabase Auth does, and this only verifies them and
 * reads the caller out of `sub`, which is what `auth.uid()` resolves to in the
 * database. See docs/api-contract.md section 2.
 *
 * Local Supabase signs with a shared HS256 secret; a hosted project signs with
 * a rotating key published as JWKS. Both are supported so the same code runs in
 * both places.
 */
export type TokenVerifier = (token: string) => Promise<JWTPayload>;

export const createVerifier = (config: Config): TokenVerifier => {
    if (!config.supabaseUrl) {
        throw new Error('Set SUPABASE_URL so token issuer and signing keys can be verified.');
    }

    const issuer = new URL('/auth/v1', config.supabaseUrl).toString().replace(/\/$/, '');
    const claims = { issuer, audience: 'authenticated' } as const;

    if (config.supabaseJwtSecret) {
        const secret = new TextEncoder().encode(config.supabaseJwtSecret);
        return async (token) =>
            (await jwtVerify(token, secret, { ...claims, algorithms: ['HS256'] })).payload;
    }

    // The key set is cached and refreshed by jose, so rotation needs no deploy.
    const jwks = createRemoteJWKSet(new URL('/auth/v1/.well-known/jwks.json', config.supabaseUrl));
    return async (token) => (await jwtVerify(token, jwks, claims)).payload;
};

const bearer = (header: string | undefined): string | null => {
    if (!header) return null;
    return /^Bearer[\t ]+(\S+)$/i.exec(header)?.[1] ?? null;
};

/**
 * Resolves the caller, or null when the request is anonymous. A malformed or
 * expired token is an error rather than a silent downgrade to anonymous: the
 * user believes they are signed in, and quietly showing them a signed-out view
 * is the harder failure to diagnose.
 */
export const resolveCaller = async (
    verify: TokenVerifier,
    authorization: string | undefined
): Promise<string | null> => {
    if (authorization === undefined) return null;

    const token = bearer(authorization);
    if (!token) {
        throw new ApiError('UNAUTHENTICATED', 'That authorization header is not valid.');
    }

    try {
        const payload = await verify(token);
        if (!payload.sub) {
            throw new ApiError(
                'UNAUTHENTICATED',
                'That session is not valid. Please sign in again.'
            );
        }
        return payload.sub;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError('UNAUTHENTICATED', 'Your session has expired. Please sign in again.');
    }
};
