import path from "node:path";
import { defineConfig } from "vitest/config";

// Minimal vitest setup for the design-system package. Tests live
// beside their source under `components/**/__tests__/*.test.ts`. We
// scope to pure-logic modules (no DOM, no React rendering) — the
// composed components that exercise cmdk + Radix are end-to-end
// tested by the consumer apps.
export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    clearMocks: true,
    exclude: ["**/node_modules/**", "**/.next/**", "**/dist/**"],
  },
  resolve: {
    alias: {
      "@repo/design-system": path.resolve(import.meta.dirname, "."),
    },
  },
});
