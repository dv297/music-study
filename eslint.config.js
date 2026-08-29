import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import { reactRefresh } from "eslint-plugin-react-refresh";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import globals from "globals";

export default defineConfig([
  globalIgnores(["dist", "node_modules", "coverage", "playwright-report", "test-results", "*.tsbuildinfo"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, tseslint.configs.recommended, reactHooks.configs.flat.recommended],
    languageOptions: {
      ecmaVersion: "latest",
      // Source runs in the browser; config/test files run under Node. Both
      // sets are harmless to allow everywhere, and TypeScript itself (via
      // `npm run typecheck`) is the real authority on undefined identifiers.
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      "no-undef": "off",
    },
  },
  {
    // Fast Refresh only cares about files that can define components.
    files: ["**/*.tsx"],
    extends: [reactRefresh.configs.vite()],
  },
  prettierRecommended,
]);
