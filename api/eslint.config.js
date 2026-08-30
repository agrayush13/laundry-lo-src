import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    { ignores: ['dist/**', 'node_modules/**'] },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['src/**/*.ts', 'tests/**/*.ts'],
        languageOptions: { globals: globals.node },
        rules: {
            // Startup and unexpected-error logs are the API's current
            // observability surface until structured reporting is connected.
            'no-console': 'off',
        },
    },
    prettier
);
