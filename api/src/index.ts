import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { createVerifier } from './auth/verifyToken.js';
import { loadConfig } from './config.js';
import { createPool } from './db/pool.js';

const config = loadConfig();
const pool = createPool(config);
const app = createApp({ pool, config, verify: createVerifier(config) });

const server = serve({ fetch: app.fetch, port: config.port }, ({ port }) => {
    console.log(`laundrylo api listening on http://localhost:${port}`);
});

// Without this a deploy drops in-flight requests and leaves Postgres holding
// the connections until they time out.
const shutdown = () => {
    server.close(() => {
        void pool.end().then(() => process.exit(0));
    });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
