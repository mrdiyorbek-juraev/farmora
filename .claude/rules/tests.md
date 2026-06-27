---
paths: "**/*.test.*", "**/*.spec.*"
---

# Test Rules

When writing tests in this repo:

## Stack

- **Unit tests:** Vitest (`apps/web/vitest.config.ts`). Run with `pnpm --filter web test`.
- **Integration tests:** Vitest with a real Clerk + Supabase setup (`apps/web/vitest.integration.config.ts`). Run with `pnpm --filter web test:integration` if wired up locally — see `rules/integration-tests.md`.
- **E2E:** Playwright (`pnpm --filter web test:e2e`).

## Invariants

- Use Vitest (not Jest).
- Colocate test files next to source: `cattle.test.ts` beside `cattle.ts`.
- `async/await`, never done callbacks.
- No `.only` or `.skip` in committed code.
- Keep suites flat — avoid deep `describe` nesting.
- Test behavior and outcomes, not implementation details.
- Assertions live inside `it()` or `test()` blocks only — no top-level `expect()`.
- For server-action / `lib/server/*` tests, prefer integration tests against a real Supabase test schema. Mocking the admin client is brittle; the duplicate-tag path in particular needs the real unique constraint to trigger.
