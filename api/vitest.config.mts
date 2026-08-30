import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        // The suite talks to the seeded local database; parallel files would
        // fight over the same rows once the write path lands.
        fileParallelism: false,
    },
});
