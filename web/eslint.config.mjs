// eslint.config.mjs
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';

const compat = new FlatCompat({
    baseDirectory: import.meta.dirname,
});

export default [
    // baseline JS recommended rules
    js.configs.recommended,
    
    // compatibility layer for old-style configs
    ...compat.extends('next/core-web-vitals'),
    
    {
        ignores: ['.next/**', 'node_modules/**'],
    },
];
