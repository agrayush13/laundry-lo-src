import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Config } from './config.js';
import type { Pool } from './db/pool.js';
import { ApiError, toErrorBody } from './http/errors.js';
import { resolveIdentity, type TokenVerifier } from './auth/verifyToken.js';
import { partnerRoutes } from './routes/partners.js';
import { accountRoutes, addressRoutes, membershipRoutes } from './routes/account.js';
import { cartRoutes } from './routes/cart.js';
import { orderRoutes } from './routes/orders.js';

export interface AppEnv {
    Variables: {
        pool: Pool;
        userId: string | null;
        userEmail: string;
        requestId: string;
    };
}

export interface AppDeps {
    pool: Pool;
    config: Config;
    verify: TokenVerifier;
}

const isSafeRequestId = (value: string | undefined): value is string =>
    value !== undefined && /^[A-Za-z0-9._:-]{1,128}$/.test(value);

export const createApp = ({ pool, config, verify }: AppDeps) => {
    const app = new Hono<AppEnv>();

    app.use(
        '*',
        cors({
            origin: config.corsOrigins,
            allowHeaders: ['Authorization', 'Content-Type', 'Idempotency-Key'],
            allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
        })
    );

    // Every request carries an id: it goes into the error body the user can
    // read out to us, and into the log line for the same failure.
    app.use('*', async (c, next) => {
        const suppliedRequestId = c.req.header('X-Request-Id');
        const requestId = isSafeRequestId(suppliedRequestId)
            ? suppliedRequestId
            : crypto.randomUUID();
        c.set('requestId', requestId);
        c.set('pool', pool);
        c.header('X-Request-Id', requestId);
        await next();
    });

    app.use('/api/*', async (c, next) => {
        const caller = await resolveIdentity(verify, c.req.header('Authorization'));
        c.set('userId', caller?.id ?? null);
        c.set('userEmail', caller?.email ?? '');
        await next();
    });

    app.get('/health', async (c) => {
        // Liveness alone would stay green with the database gone, which is the
        // outage worth knowing about.
        try {
            await pool.query('select 1');
            return c.json({ status: 'ok' as const });
        } catch {
            return c.json({ status: 'degraded' as const }, 503);
        }
    });

    app.route('/api/v1/partners', partnerRoutes);
    app.route('/api/v1/me', accountRoutes);
    app.route('/api/v1/addresses', addressRoutes);
    app.route('/api/v1/cart', cartRoutes);
    app.route('/api/v1/orders', orderRoutes);
    app.route('/api/v1/membership', membershipRoutes);

    app.notFound((c) => {
        const error = new ApiError('NOT_FOUND', 'No such endpoint.');
        return c.json(toErrorBody(error, c.get('requestId')), 404);
    });

    app.onError((error, c) => {
        const requestId = c.get('requestId') ?? 'unknown';
        if (error instanceof ApiError) {
            return c.json(toErrorBody(error, requestId), error.status as 400);
        }

        // An unexpected failure is logged in full and reported as a bare 500:
        // the message may name a column or a constraint.
        console.error(`[${requestId}]`, error);
        const internal = new ApiError('INTERNAL_ERROR', 'Something went wrong on our end.');
        return c.json(toErrorBody(internal, requestId), 500);
    });

    return app;
};
