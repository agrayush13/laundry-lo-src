const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');
const importPlugin = require('eslint-plugin-import');
const prettier = require('eslint-config-prettier');
const globals = require('globals');

module.exports = tseslint.config(
    {
        ignores: ['dist/', 'node_modules/'],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.{ts,tsx}'],
        plugins: {
            react,
            'react-hooks': reactHooks,
            import: importPlugin,
        },
        languageOptions: {
            globals: {
                ...globals.browser,
            },
        },
        settings: {
            react: {
                version: 'detect',
            },
            'import/resolver': {
                node: {
                    extensions: ['.js', '.jsx', '.ts', '.tsx'],
                },
            },
        },
        rules: {
            ...react.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            'react/react-in-jsx-scope': 'off',

            // Import order: libraries -> first party -> local components -> models
            // -> services/utils/config -> styles.
            'import/order': [
                'error',
                {
                    groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
                    pathGroups: [
                        {
                            pattern: '@ui_dev/**',
                            group: 'external',
                            position: 'after',
                        },
                        {
                            pattern: '{.,..}/**/components/**',
                            group: 'internal',
                            position: 'before',
                        },
                        {
                            pattern: '{.,..}/**/models/**',
                            group: 'internal',
                        },
                        {
                            pattern: '{.,..}/**/{data,services}/**',
                            group: 'internal',
                            position: 'after',
                        },
                        {
                            pattern: '{.,..}/**/{config,utils,hooks,context}/**',
                            group: 'internal',
                            position: 'after',
                        },
                        {
                            pattern: '*.{css,scss,sass}',
                            group: 'index',
                            position: 'after',
                            patternOptions: { matchBase: true },
                        },
                    ],
                    pathGroupsExcludedImportTypes: ['builtin'],
                    'newlines-between': 'never',
                    alphabetize: { order: 'asc', caseInsensitive: true },
                },
            ],

            // Correctness and hygiene from the guidelines.
            eqeqeq: ['error', 'always'],
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            'no-var': 'error',
            'prefer-const': 'error',
            'no-alert': 'error',
            'react/jsx-pascal-case': 'error',
            'react/self-closing-comp': 'error',
            '@typescript-eslint/no-explicit-any': 'error',

            // camelCase for variables and functions; PascalCase only for components
            // and types. UPPER_CASE is allowed for module-level constants.
            '@typescript-eslint/naming-convention': [
                'error',
                {
                    selector: 'variableLike',
                    format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
                    leadingUnderscore: 'allow',
                },
                {
                    selector: 'function',
                    format: ['camelCase', 'PascalCase'],
                },
                {
                    selector: 'typeLike',
                    format: ['PascalCase'],
                },
            ],
        },
    },
    {
        files: ['**/*.js'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
        rules: {
            '@typescript-eslint/no-require-imports': 'off',
        },
    },
    {
        files: ['**/*.{test,spec}.{ts,tsx}', 'src/setupTests.ts'],
        languageOptions: {
            globals: {
                ...globals.node,
                describe: 'readonly',
                it: 'readonly',
                expect: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly',
                vi: 'readonly',
            },
        },
    },
    prettier
);
