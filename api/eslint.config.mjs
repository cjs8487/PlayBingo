import { defineConfig } from "eslint/config";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import _import from "eslint-plugin-import";
import { fixupPluginRules } from "@eslint/compat";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([{
    extends: compat.extends("plugin:@typescript-eslint/recommended", "prettier"),

    plugins: {
        "@typescript-eslint": typescriptEslint,
        import: fixupPluginRules(_import),
    },

    languageOptions: {
        parser: tsParser,
    },

    settings: {
        "import/parsers": {
            "@typescript-eslint/parser": [".ts", ".tsx"],
        },

        "import/resolver": {
            typescript: {
                alwaysTryTypes: true,
            },
        },
    },
}, {
    files: ["src/**/*.ts"],

    rules: {
        "max-len": ["error", 120],
        "no-plusplus": ["off"],

        "object-curly-newline": ["error", {
            multiline: true,
            consistent: true,
        }],

        "no-mixed-operators": ["off"],
        "linebreak-style": ["off"],
        "lines-between-class-members": ["off"],
        "import/extensions": ["off"],
        "no-shadow": ["off"],
        "@typescript-eslint/no-shadow": ["error"],
        "no-console": "warn",
    },
}]);