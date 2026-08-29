import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// The app is served from https://dv297.github.io/music-study/, so built asset
// URLs need that prefix. The dev server stays at the root.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/music-study/" : "/",
  plugins: [react()],
  // e2e/ holds Playwright specs — vitest would otherwise try to run them too,
  // since both tools default to picking up *.spec.ts.
  test: {
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
}));
