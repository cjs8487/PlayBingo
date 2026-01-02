// eslint.config.mjs
import js from '@eslint/js';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import { defineConfig } from 'eslint/config';

const eslintConfig = defineConfig([
    js.configs.recommended,
    eslintPluginPrettierRecommended,
    ...nextVitals,
    ...nextTs,
    {
        ignores: [
            'node_modules/**',
            '.next/**',
            'out/**',
            'build/**',
            'next-env.d.ts',
        ],
    },
]);

export default eslintConfig;
