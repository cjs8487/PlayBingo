import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-config-prettier';

export default defineConfig(
    {
        ignores: ['build/**', 'coverage/**', 'node_modules/**', 'media/**'],
    },
    tseslint.configs.recommended,
    importPlugin.flatConfigs.recommended,
    prettier,
    {
        settings: {
            'import/resolver': {
                typescript: {
                    alwaysTryTypes: true,
                },
            },
        },
    },
    {
        files: ['src/**/*.ts'],
        rules: {
            'max-len': ['error', 120],
            'no-plusplus': ['off'],
            'object-curly-newline': [
                'error',
                {
                    multiline: true,
                    consistent: true,
                },
            ],
            'no-mixed-operators': ['off'],
            'linebreak-style': ['off'],
            'lines-between-class-members': ['off'],
            'import/extensions': ['off'],
            'no-shadow': ['off'],
            '@typescript-eslint/no-shadow': ['error'],
            'no-console': 'warn',
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                },
            ],
        },
    },
);
