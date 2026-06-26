import path from "node:path";
import { defineConfig } from "vitest/config";

// Minimal vitest setup. No test files exist yet; vitest exits 0 when
// nothing matches, which is what unblocks `turbo build` (build depends
// on test) on CI. As soon as you add a `*.test.ts` under `tests/` or
// next to a source file, it gets picked up automatically.
export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    clearMocks: true,
    passWithNoTests: true,
    include: ["**/*.test.{ts,tsx}"],
    exclude: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/tests/integration/**",
      "**/e2e/**",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
    },
  },
});
