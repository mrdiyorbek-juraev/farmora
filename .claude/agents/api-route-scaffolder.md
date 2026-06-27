---
name: api-route-scaffolder
description: Not applicable to this codebase — cattle-management uses server actions exclusively, never Next.js API route handlers. Use this agent ONLY if the user is explicitly migrating to API routes.
tools: Read, Grep, Glob, Bash, Edit, Write
model: sonnet
---

## Before doing anything

This project (`apps/web/`) does **not use Next.js API route handlers**. The entire server-side surface is built on Next.js Server Actions in `apps/web/app/_actions/<domain>.ts`, which delegate to server-only business logic in `apps/web/lib/server/<domain>.ts`.

If a parent agent invoked you, **stop and ask the user to confirm** before scaffolding `app/api/*/route.ts`. Adding a route handler here would be a deliberate architectural shift, not a routine change.

## What to do instead

For a "new endpoint" request, scaffold a server action pair following the existing pattern in `apps/web/app/_actions/cattle.ts` + `apps/web/lib/server/cattle.ts`:

1. **Zod schema** in `apps/web/models/<domain>.ts` for the input.
2. **Server-only function** in `apps/web/lib/server/<domain>.ts`:
   - File starts with `import "server-only";`
   - Function signature: `(organizationId: string, ...input) => Promise<...>`
   - Uses `createAdminClient()` from `@repo/database/admin`
   - Scopes every query with `.eq("organization_id", organizationId)`
   - Throws domain-specific error classes (e.g. `CattleDuplicateTagError`)
3. **Server action** in `apps/web/app/_actions/<domain>.ts`:
   - File starts with `"use server";`
   - Parses input with the Zod schema
   - Calls `getCurrentOrganization()` from `@/lib/server/organization`
   - Delegates to the `lib/server/<domain>.ts` function
4. **React Query mutation** in `apps/web/services/<domain>/mutations.ts` for client callers.

See `.claude/rules/server-actions.md` for the full pattern and rationale.

## If the user actually wants an API route

If the user confirms they want a real `app/api/*/route.ts` (e.g., for a webhook endpoint that Clerk or Stripe will hit), then:

- The route handler should still validate input with Zod and delegate to a `lib/server/<domain>.ts` function — don't put business logic in the handler.
- Webhook handlers verify the signature first, before any DB work.
- Use `NextResponse.json({...}, { status })` for responses.
- There is no shared `withErrorHandler` wrapper or `lib/errors/` factory in this codebase yet — return errors with a plain JSON body + appropriate status code, or build the wrapper if the user wants the convention.
