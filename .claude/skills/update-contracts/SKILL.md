---
name: update-contracts
description: Sync contract documentation to match current codebase state
---

# /update-contracts — Contract Sync

Keep the workspace contracts in `apps/web/.claude/contracts/` in step with the code. This codebase's "contracts" cover server actions, the Supabase schema, route map, Zustand stores, env vars, and the `@repo/*` package surface.

## Steps

1. **Scan code for current state**
   - Server actions: list all functions exported from `apps/web/app/_actions/*.ts`.
   - Routes: list `apps/web/app/**/page.tsx` and group by route segment (auth/main/etc.).
   - Schema: read `packages/database/supabase/migrations/*.sql` (apply order matters — read by filename ASC).
   - Stores: list `apps/web/stores/**/*.ts` and the state shapes they expose.
   - Env vars: read `apps/web/env.ts` (or `apps/web/.env.example` if present) for the declared shape.
   - Packages: list `packages/*/package.json` names + their `exports` field.

2. **Read current contracts** in `apps/web/.claude/contracts/` to see what's already documented.

3. **Report diffs**
   - Server actions in code but not in `api-surface.md`.
   - Tables / columns in migrations but not in `schema-reference.md`.
   - Stores in code but not in `store-inventory.md`.
   - Env vars in `env.ts` but not in `env-vars.md`.
   - Packages in `packages/` but not in `packages-inventory.md`.
   - Anything in a contract file that no longer exists in code (stale).

4. **Update the contract files**
   - Add missing entries; remove stale ones; preserve existing formatting.
   - If a contract file references concepts that don't exist in this codebase at all (Inngest events, Supabase Realtime broadcasts, RLS policies), strip those sections — they were inherited from a different project.

5. **Summary**
   - Report what was added, removed, and updated in each contract file. Note any contract file that may need a full rewrite vs incremental edits.

## Things NOT to invent

- This project has **no API routes** — only server actions. Don't generate an `api-surface.md` of REST endpoints. If `api-surface.md` exists, repurpose it as a server-action index.
- This project has **no Inngest events** and **no Supabase Realtime broadcasts**. If `event-catalog.md` exists, mark it deprecated or delete it.
- This project has **no RLS policies**. If `schema-reference.md` mentions RLS, remove that section and note that org-scoping is enforced in `apps/web/lib/server/*.ts` instead.
