# Cattle Management — Claude Code Standards

This is a **Next.js + Supabase + Clerk** monorepo for a farm-facing cattle management app. The web app at `apps/web/` is the only product surface; `apps/docs/` and `apps/storybook/` are secondary.

This file is the entry-point Claude loads every session. App-specific guidance lives in `apps/web/.claude/CLAUDE.md` and is loaded when working inside the web app.

## Quick Reference

- **Format code**: `pnpm dlx ultracite fix`
- **Check for issues**: `pnpm dlx ultracite check`
- **Diagnose setup**: `pnpm dlx ultracite doctor`
- **Web dev server**: `pnpm --filter web dev` (port 3000)
- **Web build**: `pnpm --filter web build`
- **DB schema**: `packages/database/supabase/migrations/`

Ultracite (Biome under the hood) handles formatting and most linting automatically.

---

## Repo at a glance

```
apps/
├── web/         ← Next.js 16 (App Router, Turbopack), React 19, the actual app
├── docs/        ← Mintlify documentation (rarely touched)
└── storybook/   ← Storybook component showcase

packages/
├── ai/                    ← @repo/ai — OpenAI SDK + streaming
├── auth/                  ← @repo/auth — Clerk wrapper (provider, server, client)
├── database/              ← @repo/database — Supabase clients + migrations + types
├── design-system/         ← @repo/design-system — shadcn/Radix UI components
├── internationalization/  ← @repo/internationalization
├── next-config/           ← @repo/next-config — shared Next config
├── rate-limit/            ← @repo/rate-limit — Upstash
├── security/              ← @repo/security — Arcjet
├── seo/                   ← @repo/seo
├── storage/               ← @repo/storage — Vercel Blob
└── typescript-config/     ← @repo/typescript-config
```

**Stack invariants that shape every file:**

- **Auth:** Clerk (`@clerk/nextjs`). User → Organization → Membership → org-scoped data.
- **Data access:** Server actions in `apps/web/app/_actions/*` — there are **no `app/api/*/route.ts` files** in this project.
- **DB client:** Supabase, accessed via `createAdminClient()` from `@repo/database/admin` inside server-only code (`apps/web/lib/server/*`). Org-scoping is done at the query level, not via RLS.
- **Migrations:** `packages/database/supabase/migrations/` (single dir, timestamped files).
- **No Inngest, no Supabase Realtime, no message queue.** Don't propose those — they're not wired up.
- **UI:** shadcn-style components from `@repo/design-system/components/ui/*` + Tailwind v4.
- **Client data layer:** React Query (`@tanstack/react-query`) for mutations/caches.

---

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Extract magic numbers into named constants

### Modern JavaScript/TypeScript

- Arrow functions for callbacks and short functions
- `for...of` over `.forEach()` and indexed `for`
- Optional chaining (`?.`) and nullish coalescing (`??`)
- Template literals over concatenation
- Destructuring for object/array assignments
- `const` by default, `let` only when reassigned, never `var`

### Async & Promises

- Always `await` promises in async functions
- `async/await` over chained `.then()`
- Wrap risky awaits in `try/catch`
- Never use async functions as Promise executors

### React & JSX

- Function components only
- Hooks at the top level — never conditionally
- Specify every dependency in hook deps arrays
- Stable `key` for iterables (prefer IDs, not indices)
- Nest children between tags, don't pass as props
- Don't define components inside other components
- Use semantic HTML and ARIA attributes for accessibility

### Error Handling & Debugging

- No `console.log`, `debugger`, or `alert` in committed code
- Throw `Error` objects with descriptive messages
- Don't catch errors just to rethrow
- Prefer early returns over nested conditionals

### Code Organization

- Keep functions focused; flatten deep nesting via early returns
- Extract complex conditions into named booleans
- Avoid nested ternaries
- Group related code, separate concerns

### Security

- `rel="noopener"` whenever `target="_blank"`
- Avoid `dangerouslySetInnerHTML`
- Never `eval()` or assign `document.cookie` directly
- Validate user input at every boundary

### Performance

- No spread in loop accumulators
- Hoist regex literals to module scope
- Specific imports, not namespace imports
- Avoid barrel files
- Use Next.js `<Image>`, not raw `<img>`

### Framework-Specific

**Next.js:**
- App Router metadata API for `<head>`
- Server Components for async data fetching (Client Components stay sync)
- Server Actions (`"use server"`) for mutations — see `apps/web/app/_actions/`

**React 19+:**
- `ref` as a prop (not `React.forwardRef`)

---

## Testing

- Vitest (`apps/web/vitest.config.ts`)
- E2E via Playwright (`pnpm --filter web test:e2e`)
- Write assertions inside `it()` / `test()`
- `async/await`, never done callbacks
- No `.only` / `.skip` in committed code
- Keep suites flat — avoid nested `describe`

---

## Shared Development Rules — consult when writing JS/TS

These live in `.claude/rules/` and Claude auto-loads them when relevant:

### Async patterns
- `rules/async-parallel.md` — `Promise.all()` for independent async ops
- `rules/async-api-routes.md` — start independent operations immediately in server actions
- `rules/async-defer-await.md` — move `await` into branches where actually used
- `rules/async-dependencies.md` — partial dependency chains with `.then()` + `Promise.all()`

### JS performance
- `rules/js-early-exit.md` — return early when result is determined
- `rules/js-set-map-lookups.md` — Set/Map for repeated membership checks
- `rules/js-index-maps.md` — Map for multiple `.find()` by same key
- `rules/js-combine-iterations.md` — single loop instead of chained `.filter().map()`
- `rules/js-cache-function-results.md` — cache repeated function results
- `rules/js-cache-property-access.md` — cache deep property access in hot paths
- `rules/js-hoist-regexp.md` — hoist RegExp to module scope
- `rules/js-length-check-first.md` — check array lengths before expensive comparison
- `rules/js-min-max-loop.md` — loop for min/max instead of sort
- `rules/js-tosorted-immutable.md` — `.toSorted()` for immutable sorting

### Path-scoped (auto-loaded by directory)

| Rule | Triggers on |
|------|-------------|
| `rules/server-actions.md` | `apps/web/app/_actions/**`, `apps/web/lib/server/**` |
| `rules/components.md` | `apps/web/components/**`, `apps/web/views/**` |
| `rules/models.md` | `apps/web/models/**` |
| `rules/migrations.md` | `packages/database/supabase/migrations/**` |
| `rules/packages.md` | `packages/**` |
| `rules/tests.md` | `**/*.test.*`, `**/*.spec.*` |

---

## Specialized Agents

Use these instead of doing the work by hand when the task matches.

### `migration-generator`
Generates Supabase SQL migrations under `packages/database/supabase/migrations/`. The schema convention in this repo is lowercase enum values, `uuid_generate_v4()` from `uuid-ossp`, `organization_id` FK to `organizations(id)`, and **no RLS** (org-scoping is enforced in the server-action layer via `getCurrentOrganization()`). Invoke when adding tables, enums, columns, or indexes.

Create new migration files with the Supabase CLI so timestamps are correct:
```bash
cd packages/database && pnpm supabase migration new <snake_case_name>
```

### `code-reviewer`
Reviews diffs for pattern consistency, performance, and correctness. Run before opening a PR.

### `tdd-test-writer` / `tdd-implementer`
Red/green halves of the TDD cycle. Use with `/tdd`.

### `integration-test-writer`
Writes integration tests against real Clerk auth + Supabase. See `rules/integration-tests.md` if/when integration tests get wired up here.

### `security-reviewer`
Pre-PR security pass: secrets, input validation, authz boundaries.

> **Note on `api-route-scaffolder`:** This project does **not** use Next.js API routes — all server-side work goes through server actions. Don't invoke the API-route agent; instead, add a function to `apps/web/lib/server/<domain>.ts` and expose it via a `"use server"` wrapper in `apps/web/app/_actions/<domain>.ts`.

---

## Skills (invoke via `/name`)

| Skill | Purpose |
|-------|---------|
| `/feature` | Full feature workflow: research, plan, implement, verify |
| `/fix` | Bug fix workflow: understand, fix, test, verify |
| `/tdd` | TDD cycle: write failing test → implement → refactor |
| `/refactor` | Refactoring workflow: analyze, plan, execute, verify |
| `/review` | Code review |
| `/commit-push-pr` | Commit, push, open PR (user-only invocation) |
| `/database-patterns` | Supabase migration patterns + conventions (cattle stack) |
| `/visual-qa` | Browser-based visual QA with screenshots |
| `/autopilot-loop` | Autonomous delivery cycle (user-only invocation) |

---

## Compaction Guidance

When context approaches the limit, always preserve: modified file paths, test commands used, current task context, error messages being debugged, and any plan/investigation state. Drop verbatim file contents and intermediate tool outputs.
