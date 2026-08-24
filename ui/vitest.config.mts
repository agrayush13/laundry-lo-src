import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'happy-dom',
        setupFiles: ['./src/setupTests.ts'],
        // Resolve CSS Module class names in tests instead of stubbing them out.
        css: { modules: { classNameStrategy: 'non-scoped' } },
    },
});
