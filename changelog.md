# Changelog: dagre

All notable changes to this project will be documented in this file. This project adheres to [Semantic Versioning](https://semandtic-versioning.org/).

## [3.0.0] - 2026

### Major Improvements: TypeScript Migration
* **Full TypeScript Rewrite (PR #509):** Migrated the entire core codebase from JavaScript to TypeScript for improved type safety, better IDE autocompletion, and easier maintenance.
* **Native Type Definitions:** Removed the need for external `@types/dagre` packages; high-quality types are now shipped directly with the library.
* **Modern Build Pipeline:** * Replaced **JSHint** with **ESLint** for stricter code quality.
  * Replaced **Browserify/Karma** with modern bundling and testing tools.
  * Standardized project indentation to **2 spaces** (aligning `.eslintrc` and `.editorconfig`).

### Refactoring & Fixes
* **Dependency Cleanup:** Removed deprecated dependencies including `bower.json` and legacy test configurations.
* **Module Exports:** Standardized ESM and CommonJS exports to ensure compatibility with modern bundlers like Webpack 5, Vite, and Rollup.
* **Internal Logic:** Refined internal graph traversal algorithms to utilize TypeScript interfaces, reducing "undefined" runtime errors.

---

## [2.0.0] - Legacy Modernization

### Major Changes
* **Organization Transfer:** Formally moved the repository to the `@dagrejs` GitHub organization.
* **Package Renaming:** Published under the `@dagrejs/dagre` npm scope.
* **Dropped Legacy Environments:** Discontinued support for extremely old Node.js versions (pre-v10) and legacy browsers that do not support ES6 features.

### Fixes
* **Performance Optimizations:** Improved layout calculation speeds for large-scale directed graphs.
* **Bug Fixes:** Resolved edge cases in rank constraints and node spacing that caused overlapping in specific hierarchical layouts.

---

## [1.0.0] - Initial Stable Release
* Legacy documentation for versions prior to the `@dagrejs` migration can be found in the historical archives.
