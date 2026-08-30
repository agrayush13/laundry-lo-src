import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiGet } from '../services/apiClient';
import { API_COPY } from '../config/apiConfig';

afterEach(() => vi.unstubAllGlobals());

describe('the API client', () => {
    it('returns a successful JSON response', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue(
                new Response(JSON.stringify({ status: 'ok' }), {
                    headers: { 'Content-Type': 'application/json' },
                })
            )
        );

        await expect(apiGet<{ status: string }>('/health')).resolves.toEqual({ status: 'ok' });
    });

    it('rejects malformed success responses instead of casting null to the requested type', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>proxy error</html>')));

        await expect(apiGet('/partners')).rejects.toMatchObject({
            code: 'INTERNAL_ERROR',
            message: API_COPY.unexpectedError,
            status: 200,
        });
    });

    it('preserves the API error envelope', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue(
                new Response(
                    JSON.stringify({
                        error: {
                            code: 'PARTNER_NOT_FOUND',
                            message: 'That laundry is no longer listed.',
                            requestId: 'req_123',
                        },
                    }),
                    { status: 404, headers: { 'Content-Type': 'application/json' } }
                )
            )
        );

        await expect(apiGet('/partners/nope')).rejects.toMatchObject({
            code: 'PARTNER_NOT_FOUND',
            status: 404,
            requestId: 'req_123',
        });
    });
});
