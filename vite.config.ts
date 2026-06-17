import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// Pyodide is loaded from a CDN at runtime (see index.html / worker.ts), so it is not
// bundled. Web Workers are authored with `new Worker(new URL(...), { type: "module" })`.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
  // Author workers as ES modules (we use `new Worker(new URL(...), { type: "module" })`).
  worker: {
    format: "es",
  },
});
