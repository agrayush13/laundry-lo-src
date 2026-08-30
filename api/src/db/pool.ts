import pg from 'pg';
import type { Config } from '../config.js';

export type Pool = pg.Pool;
export type Client = pg.PoolClient;

export const createPool = (config: Config): Pool =>
    new pg.Pool({
        connectionString: config.databaseUrl,
        max: 10,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 5_000,
    });

/**
 * Runs `work` inside a transaction that has assumed the caller's Postgres role,
 * so Row Level Security applies to API traffic exactly as it does to PostgREST.
 * A route that forgets an ownership check gets an empty result rather than
 * someone else's data.
 *
 * `set local` is scoped to the transaction, so a pooled connection never leaks
 * one request's identity into the next.
 */
export const asCaller = async <T>(
    pool: Pool,
    userId: string | null,
    work: (client: Client) => Promise<T>
): Promise<T> => {
    const client = await pool.connect();
    try {
        await client.query('begin');
        if (userId) {
            await client.query('select set_config($1, $2, true)', [
                'request.jwt.claims',
                JSON.stringify({ sub: userId, role: 'authenticated' }),
            ]);
            await client.query('set local role authenticated');
        } else {
            await client.query('set local role anon');
        }
        const result = await work(client);
        await client.query('commit');
        return result;
    } catch (error) {
        await client.query('rollback').catch(() => undefined);
        throw error;
    } finally {
        client.release();
    }
};
