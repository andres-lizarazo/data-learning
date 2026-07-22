import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import prettier from "eslint-config-prettier";

// Flat config. Goal: lock in the discipline the codebase already follows (strict TS, no
// stray `any`, correct hook usage) WITHOUT forcing a refactor of working code. We use the
// two classic react-hooks rules (rules-of-hooks + exhaustive-deps) rather than the newer
// react-compiler rule set, which flags patterns this codebase deliberately uses.
// Prettier is last so it disables any stylistic rules that would fight the formatter.
export default tseslint.config(
  {
    ignores: [
      "dist",
      "dev-dist",
      "coverage",
      "test-results",
      "playwright-report",
    ],
  },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  // The Web Worker talks to CDN-loaded Pyodide, whose surface is untyped by design; and it
  // runs in a worker scope, not the DOM.
  {
    files: ["src/pyodide/worker.ts"],
    languageOptions: { globals: { ...globals.worker } },
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  },
  // DsaViz is the one content->component boundary where `block.data` is `unknown` by design
  // (authors hand-write heterogeneous shapes per visualizer). A single typed-`any` cast is
  // the honest way to express that boundary; every consumer defaults its props if a field
  // is missing, so malformed content degrades gracefully rather than crashing.
  {
    files: ["src/components/visualizer/dsa/DsaViz.tsx"],
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  },
  prettier,
);
