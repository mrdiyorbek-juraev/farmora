---
paths: "packages/database/supabase/migrations/**"
---

# Database Migration Rules

All schema migrations live in `packages/database/supabase/migrations/`. There is one initial migration today; new ones append.

## Required reading

- `.claude/skills/database-patterns/SKILL.md` — full patterns + conventions.

## Invariants

- **Create new files via the Supabase CLI** so the timestamp prefix is correct:
  ```
  cd packages/database && pnpm supabase migration new <snake_case_name>
  ```
- **Never modify an existing migration file** — append a new one.
- **Idempotency:** wrap enum creation in `do $$ begin ... exception when duplicate_object then null; end $$;` and use `create table if not exists` / `create index if not exists`. This matches the init migration's style.
- **UUIDs:** use `uuid_generate_v4()` from the `uuid-ossp` extension (matches existing rows), not `gen_random_uuid()`.
- **Enum values:** lowercase strings (`'active'`, `'female'`, `'born_on_farm'`) — matches the existing schema.
- **Org scoping:** every org-owned table MUST have `organization_id uuid not null references organizations(id) on delete cascade` and an index on it.
- **Timestamps:** `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()`.
- **No RLS in this project.** Org-scoping is enforced in `apps/web/lib/server/*.ts` via `.eq("organization_id", organizationId)`. Don't add `alter table ... enable row level security` unless you also wire policies AND switch the server code off `createAdminClient()`.
- **No data migrations in schema files** — no INSERT/UPDATE/DELETE of rows in schema migrations. If you need to seed, do it in a separate seed script.
- After running a migration locally, regenerate types:
  ```
  pnpm --filter @repo/database db:types
  ```
  (or whichever script the package exposes — check `packages/database/package.json`).

## Use the `migration-generator` agent

For anything beyond a one-column ADD, hand the task to the `migration-generator` agent — it knows these conventions.
