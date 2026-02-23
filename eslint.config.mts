import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import {defineConfig} from "eslint/config";

export default defineConfig([
    {
        ignores: ["dist/*", "build/*", "**/*.js"],
    },
    {
        files: ["**/*.{ts,mts,cts}"],
        plugins: {js},
        extends: [
            "js/recommended",
            ...tseslint.configs.recommended,
        ],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.es2015,
                ...globals.node,
                ...globals.jest,
            },
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                allowImportExportEverywhere: true,
            },
        },
        rules: {
            "indent": ["error", 4],
            "linebreak-style": ["error", "unix"],
            "no-prototype-builtins": 0,
            "semi": ["error", "always"],
            "@typescript-eslint/no-unused-vars": ["error", {
                "argsIgnorePattern": "^_",
                "varsIgnorePattern": "^_",
                "caughtErrorsIgnorePattern": "^_",
            }],
        },
    },
]);
