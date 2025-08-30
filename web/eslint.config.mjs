// eslint.config.mjs
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import eslintPluginPrettierRecommened from 'eslint-plugin-prettier/recommended';

const compat = new FlatCompat({
    baseDirectory: import.meta.dirname,
});

const eslintConfig = [
    // baseline JS recommended rules
    js.configs.recommended,

    // compatibility layer for old-style configs
    ...compat.extends('next/core-web-vitals', 'next/typescript'),

    eslintPluginPrettierRecommened,

    {
        ignores: ['.next/**', 'node_modules/**'],
    },
];

export default eslintConfig;
