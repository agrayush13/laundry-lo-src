import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import type { Config } from '../src/config.js';
import type { Pool } from '../src/db/pool.js';

const config: Config = {
    port: 8787,
    databaseUrl: 'postgresql://unused',
    supabaseUrl: 'http://127.0.0.1:54321',
    supabaseJwtSecret: 'test-secret',
    corsOrigins: ['http://localhost:3000'],
    isProduction: false,
};

describe('GET /health', () => {
    it('reports a dependency outage as degraded without authenticating the probe', async () => {
        const query = vi.fn().mockRejectedValue(new Error('database unavailable'));
        const verify = vi.fn();
        const app = createApp({ pool: { query } as unknown as Pool, config, verify });

        const response = await app.request('http://localhost/health', {
            headers: { Authorization: 'Bearer stale-token' },
        });

        expect(response.status).toBe(503);
        expect(await response.json()).toEqual({ status: 'degraded' });
        expect(verify).not.toHaveBeenCalled();
    });

    it('echoes a safe caller-supplied request id', async () => {
        const query = vi.fn().mockResolvedValue({ rows: [] });
        const app = createApp({ pool: { query } as unknown as Pool, config, verify: vi.fn() });

        const response = await app.request('http://localhost/health', {
            headers: { 'X-Request-Id': 'edge-01:request_42' },
        });

        expect(response.headers.get('X-Request-Id')).toBe('edge-01:request_42');
    });

    it('replaces an unsafe request id instead of reflecting it', async () => {
        const query = vi.fn().mockResolvedValue({ rows: [] });
        const app = createApp({ pool: { query } as unknown as Pool, config, verify: vi.fn() });

        const response = await app.request('http://localhost/health', {
            headers: { 'X-Request-Id': '<script>' },
        });
        const requestId = response.headers.get('X-Request-Id');

        expect(requestId).not.toBe('<script>');
        expect(requestId).toMatch(/^[0-9a-f]{8}-[0-9a-f-]{27}$/i);
    });
});
