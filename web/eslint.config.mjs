// eslint.config.mjs
import js from '@eslint/js';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import { defineConfig, globalIgnores } from 'eslint/config';

const eslintConfig = defineConfig([
    // baseline JS recommended rules
    js.configs.recommended,

    // compatibility layer for old-style configs

    eslintPluginPrettierRecommended,
    ...nextVitals,
    ...nextTs,

    globalIgnores([
        // Default ignores of eslint-config-next:
        '.next/**',
        'out/**',
        'build/**',
        'next-env.d.ts',
        'node_modules/**',
    ]),
]);

export default eslintConfig;
