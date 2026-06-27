---
name: review
description: Code review workflow - read, analyze, report issues
---

# /review — Code Review Workflow

Given a file, directory, or PR to review, follow this exact workflow.

## 1. Read the Code

- Read every file in the scope of the review.
- Understand the intent — what is this code trying to do?

## 2. Check Patterns

Compare against the project conventions in `.claude/CLAUDE.md` and `apps/web/.claude/CLAUDE.md`:
- [ ] Server actions live in `apps/web/app/_actions/<domain>.ts` and follow the parse → `getCurrentOrganization()` → delegate pattern. No `app/api/*/route.ts` files.
- [ ] Server helpers in `apps/web/lib/server/<domain>.ts` start with `import "server-only";` and take `organizationId` as the first arg.
- [ ] Every Supabase query is scoped by `.eq("organization_id", organizationId)`.
- [ ] Zod schemas live in `apps/web/models/<domain>.ts`.
- [ ] Imports organized correctly (external → `@repo/*` → `@/` internal → relative).
- [ ] `import type` for type-only imports.
- [ ] UI uses `@repo/design-system/components/ui/*` — no raw `<button>`, `<input>`, `<dialog>`. Composed inputs use `InputGroup`.
- [ ] `cn()` from `@repo/design-system/lib/utils` for class merging.
- [ ] Icons from `lucide-react` only.
- [ ] `const` arrow functions; event handlers prefixed with `handle` or `on`.
- [ ] Early returns — guard clauses first, happy path last.
- [ ] Modals follow the flat single-file pattern: `views/<area>/modals/<name>/index.tsx` opens via the global modal store.
- [ ] Static data lives in `apps/web/mocks/<domain>/*` or `apps/web/constants/*`, not inline in components.
- [ ] Stores follow the single-setter / named `StateCreator` / `initialXxx` export pattern.

## 3. Check Data Patterns

- [ ] React Query mutations live in `apps/web/services/<domain>/mutations.ts` and own toast + cache invalidation.
- [ ] Query keys come from a factory (e.g. `cattleKeys.list(filters)`), not inline string arrays.
- [ ] No raw `fetch()` from the client — server actions are the API surface.

## 4. Check Performance

- [ ] No unnecessary re-renders (stable callbacks, proper deps).
- [ ] `useMemo` / `useCallback` only where they pay off.
- [ ] Independent awaits run in parallel via `Promise.all()` (see `.claude/rules/async-parallel.md`).
- [ ] `await` deferred into the branch that uses the value (see `.claude/rules/async-defer-await.md`).
- [ ] Hot-path regex hoisted to module scope (`.claude/rules/js-hoist-regexp.md`).
- [ ] Repeated lookups use `Map` / `Set` (`.claude/rules/js-index-maps.md`, `js-set-map-lookups.md`).

## 5. Check Security

- [ ] No secrets, API keys, or `.env` values in code.
- [ ] No raw user input concatenated into queries.
- [ ] `dangerouslySetInnerHTML` only with explicit sanitization.
- [ ] `rel="noopener"` on `target="_blank"` links.
- [ ] Auth is checked server-side via `getCurrentOrganization()`. Don't trust the client.
- [ ] `createAdminClient()` is never imported from a Client Component.
- [ ] Bulk operations double-scope `.in("id", ids)` together with `.eq("organization_id", organizationId)`.

## 6. Report

Provide findings organized by severity:
- **Blockers**: Must fix before merging (security, data leaks, broken functionality).
- **Issues**: Should fix (pattern violations, performance problems).
- **Suggestions**: Nice to have (readability, minor improvements).
- **Good**: Things done well worth calling out.
