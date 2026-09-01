import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiDelete, apiGet, apiPost } from '../services/apiClient';
import { setAuthAccessToken } from '../services/authToken';
import { API_COPY } from '../config/apiConfig';

afterEach(() => {
    setAuthAccessToken(null);
    vi.unstubAllGlobals();
});

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

    it('attaches the current Supabase access token without persisting it itself', async () => {
        const fetch = vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ status: 'ok' }), {
                headers: { 'Content-Type': 'application/json' },
            })
        );
        vi.stubGlobal('fetch', fetch);
        setAuthAccessToken('access-token');

        await apiGet('/partners');

        expect(fetch).toHaveBeenCalledWith(
            '/api/v1/partners',
            expect.objectContaining({
                headers: expect.objectContaining({ Authorization: 'Bearer access-token' }),
            })
        );
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

    it('sends JSON mutations and caller-provided idempotency headers', async () => {
        const fetch = vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ id: 'ord_1' }), {
                status: 201,
                headers: { 'Content-Type': 'application/json' },
            })
        );
        vi.stubGlobal('fetch', fetch);

        await apiPost(
            '/orders',
            { cartId: 'crt_1' },
            {
                headers: { 'Idempotency-Key': 'request-key' },
            }
        );

        expect(fetch).toHaveBeenCalledWith(
            '/api/v1/orders',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ cartId: 'crt_1' }),
                headers: expect.objectContaining({
                    'Content-Type': 'application/json',
                    'Idempotency-Key': 'request-key',
                }),
            })
        );
    });

    it('accepts an empty 204 response for delete operations', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
        await expect(apiDelete('/cart')).resolves.toBeUndefined();
    });

    it('falls back to a safe message when an error envelope is incomplete', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue(
                new Response(
                    JSON.stringify({
                        error: {
                            code: 'PARTNER_NOT_FOUND',
                            requestId: 'req_123',
                        },
                    }),
                    { status: 502, headers: { 'Content-Type': 'application/json' } }
                )
            )
        );

        await expect(apiGet('/partners/nope')).rejects.toMatchObject({
            code: 'INTERNAL_ERROR',
            message: API_COPY.unexpectedError,
            status: 502,
        });
    });
});
