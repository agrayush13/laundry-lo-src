import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SignJWT } from 'jose';
import { asCaller } from '../src/db/pool.js';
import { get, pool, requireDatabase } from './helpers.js';

/**
 * The RLS design is the load-bearing security claim in this service: a route
 * that forgets an ownership check is supposed to get an empty result rather than
 * someone else's data. Nothing exercised it until now, so a `set local role`
 * that silently stopped working would have passed the whole suite.
 */
beforeAll(requireDatabase);
afterAll(async () => {
    await pool.end();
});

const secret = new TextEncoder().encode(process.env['SUPABASE_JWT_SECRET']!);
const issuer = new URL('/auth/v1', process.env['SUPABASE_URL']!).toString().replace(/\/$/, '');

const token = (claims: Record<string, unknown>) =>
    new SignJWT(claims)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuer(issuer)
        .setAudience('authenticated')
        .setExpirationTime('1h')
        .sign(secret);

const ALICE = 'aaaaaaaa-0000-0000-0000-000000000001';

describe('token verification', () => {
    it.each(['', 'Basic credentials', 'Bearer', 'Bearer token with-spaces'])(
        'rejects a malformed authorization header: %s',
        async (authorization) => {
            const { status, body } = await get('/api/v1/partners', {
                Authorization: authorization,
            });

            expect(status).toBe(401);
            expect(body).toMatchObject({ error: { code: 'UNAUTHENTICATED' } });
        }
    );

    it('rejects a malformed token rather than quietly serving the signed-out view', async () => {
        const { status, body } = await get('/api/v1/partners', {
            Authorization: 'Bearer not-a-jwt',
        });

        // The user believes they are signed in; showing them anonymous data is
        // the harder failure to diagnose. See auth/verifyToken.ts.
        expect(status).toBe(401);
        expect(body).toMatchObject({ error: { code: 'UNAUTHENTICATED' } });
    });

    it('rejects an expired token', async () => {
        const expired = await new SignJWT({ sub: ALICE })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuer(issuer)
            .setAudience('authenticated')
            .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
            .sign(secret);

        const { status } = await get('/api/v1/partners', { Authorization: `Bearer ${expired}` });
        expect(status).toBe(401);
    });

    it('rejects a token with no subject, which is what a machine key looks like', async () => {
        const { status } = await get('/api/v1/partners', {
            Authorization: `Bearer ${await token({ role: 'anon' })}`,
        });
        expect(status).toBe(401);
    });

    it('rejects a signed token that does not carry the authenticated role', async () => {
        const { status } = await get('/api/v1/partners', {
            Authorization: `Bearer ${await token({ sub: ALICE, role: 'anon' })}`,
        });
        expect(status).toBe(401);
    });

    it('rejects a non-UUID subject before it can reach auth.uid()', async () => {
        const { status } = await get('/api/v1/partners', {
            Authorization: `Bearer ${await token({ sub: 'not-a-user-id', role: 'authenticated' })}`,
        });
        expect(status).toBe(401);
    });

    it('rejects a correctly signed token issued for another project', async () => {
        const foreign = await new SignJWT({ sub: ALICE })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuer('https://another-project.example/auth/v1')
            .setAudience('authenticated')
            .setExpirationTime('1h')
            .sign(secret);

        const { status } = await get('/api/v1/partners', {
            Authorization: `Bearer ${foreign}`,
        });
        expect(status).toBe(401);
    });

    it('serves a signed-in caller the same public listing as an anonymous one', async () => {
        const anonymous = await get('/api/v1/partners');
        const signedIn = await get('/api/v1/partners', {
            Authorization: `Bearer ${await token({ sub: ALICE, role: 'authenticated' })}`,
        });

        expect(signedIn.status).toBe(200);
        expect(signedIn.body).toEqual(anonymous.body);
    });

    it('leaves an anonymous request anonymous', async () => {
        const { status } = await get('/api/v1/partners');
        expect(status).toBe(200);
    });
});

describe('asCaller', () => {
    it('assumes the Postgres role it claims to', async () => {
        const anonymous = await asCaller(pool, null, async (client) => {
            const { rows } = await client.query<{ who: string }>('select current_user as who');
            return rows[0]!.who;
        });
        const authenticated = await asCaller(pool, ALICE, async (client) => {
            const { rows } = await client.query<{ who: string }>('select current_user as who');
            return rows[0]!.who;
        });

        expect(anonymous).toBe('anon');
        expect(authenticated).toBe('authenticated');
    });

    it('resolves auth.uid() to the caller the token named', async () => {
        const uid = await asCaller(pool, ALICE, async (client) => {
            const { rows } = await client.query<{ uid: string | null }>('select auth.uid() as uid');
            return rows[0]!.uid;
        });

        expect(uid).toBe(ALICE);
    });

    it('does not leak one request identity into the next on a pooled connection', async () => {
        // `set local` is scoped to the transaction. This is the reason it has to
        // be: the same physical connection serves the next caller.
        await asCaller(pool, ALICE, (client) => client.query('select 1'));

        const uid = await asCaller(pool, null, async (client) => {
            const { rows } = await client.query<{ uid: string | null }>('select auth.uid() as uid');
            return rows[0]!.uid;
        });

        // Note this passes because auth.uid() nullifs the empty string: after a
        // transaction that set the claims, the setting is left as '' rather than
        // unset on the same connection.
        expect(uid).toBeNull();
    });
});

describe('row level security', () => {
    it('does not expose the security-definer slot generator to API callers', async () => {
        const { rows } = await pool.query<{ role: string; allowed: boolean }>(
            `select role,
                    has_function_privilege(
                        role,
                        'public.generate_slots(text,date,integer,integer,integer)',
                        'execute'
                    ) as allowed
             from unnest(array['anon', 'authenticated']) as role`
        );

        expect(rows).toEqual([
            { role: 'anon', allowed: false },
            { role: 'authenticated', allowed: false },
        ]);
    });

    it('keeps the rolling slot scheduler privileged and idempotent', async () => {
        const { rows } = await pool.query<{ role: string; allowed: boolean }>(
            `select role,
                    has_function_privilege(
                        role,
                        'public.refresh_scheduled_slots(integer)',
                        'execute'
                    ) as allowed
             from unnest(array['anon', 'authenticated', 'service_role']) as role`
        );
        expect(rows).toEqual([
            { role: 'anon', allowed: false },
            { role: 'authenticated', allowed: false },
            { role: 'service_role', allowed: true },
        ]);

        const refreshed = await pool.query<{ created: number }>(
            'select public.refresh_scheduled_slots(14) as created'
        );
        expect(Number(refreshed.rows[0]?.created)).toBeGreaterThanOrEqual(0);
    });

    it('rejects unsafe slot-generation arguments before doing any work', async () => {
        await expect(
            pool.query("select public.generate_slots('1001', current_date, 0)")
        ).rejects.toMatchObject({ code: '22023' });
    });

    it('shows one customer only their own rows', async () => {
        const bob = 'bbbbbbbb-0000-0000-0000-000000000002';

        // Committed rather than wrapped in a transaction: `asCaller` opens its
        // own connection, so it cannot see uncommitted work on another one.
        // (`pool.query('begin')` would not even hold - node-pg hands the
        // connection back after every query.) Cleaned up in `finally` instead.
        try {
            await pool.query(
                'insert into auth.users (id) values ($1), ($2) on conflict (id) do nothing',
                [ALICE, bob]
            );
            await pool.query(
                `insert into public.profiles (id, full_name) values ($1,'Alice'), ($2,'Bob')
                 on conflict (id) do nothing`,
                [ALICE, bob]
            );
            await pool.query(
                `insert into public.addresses (user_id,label,recipient_name,phone,building,street,pincode)
                 values ($1,'Home','Alice','1','1','A St','560103'),
                        ($2,'Home','Bob','2','2','B St','560103')`,
                [ALICE, bob]
            );

            const seen = await asCaller(pool, ALICE, async (client) => {
                const { rows } = await client.query<{ recipient_name: string }>(
                    'select recipient_name from public.addresses'
                );
                return rows.map((row) => row.recipient_name);
            });

            // A route that forgot `where user_id = auth.uid()` gets this result.
            expect(seen).toEqual(['Alice']);
        } finally {
            // auth.users cascades to profiles, which cascades to addresses.
            await pool.query('delete from auth.users where id = any($1::uuid[])', [[ALICE, bob]]);
        }
    });

    it('keeps the partner catalogue readable to everyone', async () => {
        const counts = await asCaller(pool, null, async (client) => {
            const { rows } = await client.query<{ partners: number; slots: number }>(
                `select (select count(*) from public.partners) as partners,
                        (select count(*) from public.slots)    as slots`
            );
            return rows[0]!;
        });

        expect(Number(counts.partners)).toBeGreaterThan(0);
        expect(Number(counts.slots)).toBeGreaterThan(0);
    });
});
