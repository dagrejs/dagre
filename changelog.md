# Changelog: dagre

All notable changes to this project will be documented in this file. This project adheres to [Semantic Versioning](https://semandtic-versioning.org/).

## v3.1.3

### Fixes & Improvements
* **ESM & Package Exports (PR #516):** Added `"type": "module"` to `package.json` and renamed the CommonJS bundle to `dist/dagre.cjs` so both ESM `import` and CommonJS `require()` resolve properly. Re-exported `Graph` with default generic parameters for backward compatibility.
* **Dynamic Layout State Isolation (PR #515):** Scoped remembered dynamic layout state to the input graph rather than module-level state to prevent state leaks across layouts.
* **Cluster Edge Routing (PR #523):** Restored internal edge routes inside clusters with custom `rankdir` directions.
* **Zero-Width Node Intersections (PR #524):** Fixed vertical edge route intersection calculations with zero-width nodes.
* **Parallel Edge Subgraph Sorting (PR #522):** Fixed `sortSubgraph` so each parallel-edge dummy node is paired at most once when laying out three or more parallel edges.
* **Flat Graph Conflict Scan Optimization (PR #520):** Skipped `findType2Conflicts` scan when no border dummy nodes are present in flat graphs.
* **Release & Tooling (PR #526, PR #527):** Added a preflight release check to ensure `changelog.md` is updated before releasing, and added `.pre-commit-config.yaml` to run tests.
* **Dependency Updates:** Updated `@dagrejs/graphlib` to `4.0.6`.

---

## [3.1.0] - 2026

### New Features
* **Per-Cluster Direction Support (PR #511):** Each cluster/subgraph can now specify its own `rankdir`, `ranksep`, `nodesep`, and `align` settings. The layout engine recursively applies these settings, enabling complex nested cluster hierarchies with independent flow directions. Fully backward compatible with global `rankdir` and legacy layouts.
* **Dynamic Graph Layout Support (PR #512):** Added support for dynamic graph layouts via `useDynamic` and `corePath` configuration options in `LayoutConfig`. Enables persistent node ordering and layout stability when modifying graph structures.

### Refactoring & Fixes
* **TypeScript & Type Safety Improvements:** Added `ClusterNodeLabel` and `NodeCollection` types, updated `NodeLabel` interfaces, and eliminated `any` type assertions across the codebase.
* **Nested Cluster Fixes:** Resolved edge cases in nested cluster isolation and improved edge routing for cross-cluster edges.

---

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
