import { defineConfig } from 'eslint/config';
import { configs as tsConfigs } from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default defineConfig(
    {
        ignores: ['build/**', 'coverage/**', 'node_modules/**', 'media/**'],
    },
    tsConfigs.recommended,
    importPlugin.flatConfigs.recommended,
    importPlugin.flatConfigs.typescript,
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
        files: ['**/*.ts'],
        rules: {
            'no-shadow': 'off',
            '@typescript-eslint/no-shadow': 'error',
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
        },
    },
    {
        // Scripts and migrations are CLI tools, so console output is expected there.
        files: ['src/**/*.ts'],
        rules: {
            'no-console': 'warn',
        },
    },
    // Must stay last: disables formatting rules that conflict with Prettier and reports Prettier diffs as lint errors.
    eslintPluginPrettierRecommended,
);
