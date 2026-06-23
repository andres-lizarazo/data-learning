/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

// Pyodide is loaded from a CDN at runtime (see index.html / worker.ts), so it is not
// bundled. Web Workers are authored with `new Worker(new URL(...), { type: "module" })`.
export default defineConfig({
  // Local dev/preview serve at root ("/"). The deploy workflow sets DEPLOY_BASE to the
  // GitHub Pages project subpath (e.g. "/python-learning/") so production assets resolve.
  base: process.env.DEPLOY_BASE || "/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "Data Learning — Learn Python & SQL, Visually",
        short_name: "Data Learning",
        description:
          "Interactive, visual platform to learn Python and PostgreSQL — in your browser via Pyodide and PGlite.",
        theme_color: "#070710",
        background_color: "#070710",
        display: "standalone",
        // Relative so the PWA works whether served at "/" (local) or a subpath (Pages).
        start_url: ".",
        scope: "./",
        icons: [
          { src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" },
        ],
      },
      workbox: {
        navigateFallbackDenylist: [/^\/sw\.js$/],
        // PGlite's Postgres WASM + data files are several MB each; precache them so SQL
        // works offline (the default 2 MB limit would skip them).
        maximumFileSizeToCacheInBytes: 16 * 1024 * 1024,
        runtimeCaching: [
          {
            // Cache the Pyodide runtime + wheels for fast, offline-capable reloads.
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/pyodide\/.*/,
            handler: "CacheFirst",
            options: {
              cacheName: "pyodide-runtime",
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  // PGlite ships its own WASM/data assets and must not be pre-bundled by esbuild.
  optimizeDeps: {
    exclude: ["@electric-sql/pglite"],
  },
  server: {
    port: 5173,
  },
  // Author workers as ES modules (we use `new Worker(new URL(...), { type: "module" })`).
  worker: {
    format: "es",
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
