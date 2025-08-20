const globals = require("globals");
const js = require("@eslint/js");
const tseslint = require("typescript-eslint");

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es6,
        ...globals.mocha,
        ...globals.node,
      },
      parserOptions: {
        allowImportExportEverywhere: true,
      },
    },
    rules: {
      indent: ["error", 2],
      "linebreak-style": ["error", "unix"],
      "no-prototype-builtins": "off",
      semi: ["error", "always"],
    },
  },

  // TypeScript config
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        // Set this to your tsconfig for type-aware rules:
        // project: "./tsconfig.json",
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: { "@typescript-eslint": tseslint.plugin },
    rules: {
      // Prefer TS-aware equivalents
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["error"],
      semi: "off",
    },
  },
];
