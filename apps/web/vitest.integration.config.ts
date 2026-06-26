import path from "node:path";
import { defineConfig } from "vitest/config";

// Integration tests live under `tests/integration/**/*.test.ts`. Like
// the unit config, this passes with no tests so it doesn't block CI
// while the suite is empty.
export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    clearMocks: true,
    passWithNoTests: true,
    include: ["**/tests/integration/**/*.test.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/.next/**", "**/dist/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
    },
  },
});
