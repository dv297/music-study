import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The app is served from https://dv297.github.io/music-study/, so built asset
// URLs need that prefix. The dev server stays at the root.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/music-study/" : "/",
  plugins: [react()],
}));
