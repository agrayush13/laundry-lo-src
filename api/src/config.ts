/**
 * Every environment value the service reads, resolved once at boot so a missing
 * one is a startup failure rather than a 500 on the first request that needs it.
 */

const required = (name: string): string => {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
};

const optional = (name: string): string | undefined => process.env[name] || undefined;

export interface Config {
    port: number;
    databaseUrl: string;
    /** Used to reach Supabase's JWKS when no shared secret is configured. */
    supabaseUrl: string | undefined;
    /** Local Supabase signs with HS256 and this shared secret; hosted uses JWKS. */
    supabaseJwtSecret: string | undefined;
    corsOrigins: string[];
    isProduction: boolean;
}

export const loadConfig = (): Config => ({
    port: Number(process.env.PORT ?? 8787),
    databaseUrl: required('DATABASE_URL'),
    supabaseUrl: optional('SUPABASE_URL'),
    supabaseJwtSecret: optional('SUPABASE_JWT_SECRET'),
    corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
        .split(',')
        .map((o) => o.trim()),
    isProduction: process.env.NODE_ENV === 'production',
});
