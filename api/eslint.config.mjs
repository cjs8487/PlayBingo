import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommened from 'eslint-plugin-prettier/recommended';

export default defineConfig(
    eslint.configs.recommended,
    tseslint.configs.strictTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
            },
        },
    },
    tseslint.configs.stylistic,
    eslintPluginPrettierRecommened,
    {
         rules: {
            "no-plusplus": ["off"],
            "object-curly-newline": [
                "error",
                {
                    "multiline": true,
                    "consistent": true
                }
            ],
            "no-mixed-operators": ["off"],
            "linebreak-style": ["off"],
            "lines-between-class-members": ["off"],
            "import/extensions": ["off"],
            "no-shadow": ["off"],
            "@typescript-eslint/no-shadow": ["error"],
            "no-console": "warn",
            "@typescript-eslint/no-floating-promises": "off",
            "@typescript-eslint/restrict-template-expressions": [
                "error",
                {
                    allowNumber: true
                }
            ],
            "@typescript-eslint/consistent-indexed-object-style": "off",
            "@typescript-eslint/no-inferrable-types": "off"
        },
        ignores: ['src/tests/coverage/**']
    }
);