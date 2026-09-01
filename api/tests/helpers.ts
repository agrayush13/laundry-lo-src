import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { createPool } from '../src/db/pool.js';
import { createVerifier } from '../src/auth/verifyToken.js';

process.env['DATABASE_URL'] ??= 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
process.env['SUPABASE_JWT_SECRET'] ??= 'super-secret-jwt-token-with-at-least-32-characters-long';
process.env['SUPABASE_URL'] ??= 'http://127.0.0.1:54321';

const config = loadConfig();
export const pool = createPool(config);
export const app = createApp({ pool, config, verify: createVerifier(config) });

/** These are integration tests: they want the seeded local Supabase database. */
export const requireDatabase = async () => {
    try {
        await pool.query('select 1 from public.partners limit 1');
    } catch (error) {
        throw new Error(
            'Cannot reach the seeded local database. Run `npm run db:start` and ' +
                `\`npm run db:reset\` at the repo root first.\n${String(error)}`
        );
    }
};

export const get = async (path: string, headers: Record<string, string> = {}) => {
    const response = await app.request(`http://localhost${path}`, { headers });
    const body: unknown = await response.json();
    return { status: response.status, body };
};

export const request = async (
    method: string,
    path: string,
    body?: unknown,
    headers: Record<string, string> = {}
) => {
    const response = await app.request(`http://localhost${path}`, {
        method,
        headers: {
            ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
            ...headers,
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const responseBody: unknown = response.status === 204 ? null : await response.json();
    return { status: response.status, body: responseBody };
};
