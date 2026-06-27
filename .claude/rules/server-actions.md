---
paths: "apps/web/app/_actions/**", "apps/web/lib/server/**"
---

# Server Actions & Server-Only Code

This project has **no `app/api/*/route.ts` files** — every server-side operation runs through a Next.js server action under `apps/web/app/_actions/<domain>.ts`, which delegates to server-only business logic in `apps/web/lib/server/<domain>.ts`.

## Invariants for `apps/web/app/_actions/<domain>.ts`

- File starts with `"use server";`.
- Each action: parse input with the Zod schema from `@/models/<domain>`, call `getCurrentOrganization()` from `@/lib/server/organization`, delegate to a `lib/server/<domain>.ts` function. **In that order.** Don't reach Supabase directly from an action.
- Pass `organization.id` (and `userId` where the caller's identity matters for audit) as the first arguments to the server helper. Never pass the raw request input through unvalidated.
- Don't `try/catch` here unless you need to translate one error type to another — let the caller surface errors via the toast layer in `apps/web/services/<domain>/mutations.ts`.

Example pattern (see `apps/web/app/_actions/cattle.ts`):
```ts
export async function createCattleAction(rawInput: CreateCattleInput) {
  const input = createCattleInputSchema.parse(rawInput);
  const { organization, userId } = await getCurrentOrganization();
  return createCattle(organization.id, userId, input);
}
```

## Invariants for `apps/web/lib/server/<domain>.ts`

- File starts with `import "server-only";`. This makes accidental client imports fail loudly.
- Every function takes `organizationId: string` as the first argument so org-scoping is impossible to forget.
- Use `createAdminClient()` from `@repo/database/admin`. Don't import any browser-side Supabase client.
- Scope every query with `.eq("organization_id", organizationId)`. The admin client bypasses RLS — code-level scoping is the only thing protecting tenant isolation.
- Throw domain-specific error classes (`CattleDuplicateTagError`, `CattleNotFoundError`, `CattleQueryError`). Catch Postgres unique violations explicitly: `if (error.code === "23505") throw new ...DuplicateError(...)`.
- For bulk operations, scope `.in("id", ids)` AND `.eq("organization_id", organizationId)` together so a stale client-side id list can't reach into another org's data.

## Async patterns

- Independent reads (e.g. fetching config + auth + user data) — start them immediately and `await Promise.all([...])` at the end. See `rules/async-api-routes.md` and `rules/async-parallel.md`.
- Move `await` into the branch that actually uses the value — see `rules/async-defer-await.md`.

## When NOT to add an action

If the data is shown by a Server Component, fetch it directly in the RSC instead of going through an action. Actions are for **mutations from the client** and for client-side queries that need to re-run on demand.
