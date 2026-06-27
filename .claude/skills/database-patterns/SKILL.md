# Supabase Database Patterns — Cattle Management

This document defines the migration patterns and conventions for the `migration-generator` agent and any database work in this project. It mirrors the style of the existing init migration at `packages/database/supabase/migrations/20260626120000_init.sql`.

## Migration File Creation

**Always use the Supabase CLI** from inside the database package so the timestamp prefix is correct:

```bash
cd packages/database && pnpm supabase migration new <snake_case_name>
```

Never hand-create migration files — the CLI generates correctly timestamped names.

**Migrations directory:** `packages/database/supabase/migrations/`. There is only one dir; do not add per-app migration dirs.

## Migration File Structure

1. Header comment (title, "Apply locally with…" line, "Apply to remote with…" line)
2. `create extension if not exists "uuid-ossp";` if not already enabled
3. Enum types (before tables that use them), wrapped in idempotent `do $$ ... exception when duplicate_object then null; end $$;`
4. Tables (`create table if not exists ...`)
5. Indexes (`create index if not exists ...`)
6. UNIQUE constraints already inside the `create table` statement when scoped (e.g. `unique (organization_id, tag_number)`)

**Header format (matches the init migration):**
```sql
-- <Domain> — <short description>
-- Apply locally with: pnpm --filter @repo/database db:reset
-- Apply to remote with: pnpm --filter @repo/database db:push
```

**Section markers (Unicode box-drawing — matches the init migration):**
```sql
-- ─── ENUMS ─────────────────────────────────────────────────────────
-- ─── <table_name> ──────────────────────────────────────────────────
```

---

## Table Patterns

### Naming
- Lowercase, plural for collections: `organizations`, `memberships`, `cattle`, `status_history`.
- Junction tables: `<left>_<right>` (e.g., `cattle_vaccinations`).

### Standard Columns

```sql
create table if not exists <table_name> (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  -- (other FK columns)
  -- (data columns)
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
```

- `id` — UUID PK with `uuid_generate_v4()` (NOT `gen_random_uuid()` — matches existing rows).
- `organization_id` — **required on every org-owned table.** `uuid not null` referencing `organizations(id)`.
- `created_at` / `updated_at` — `timestamptz not null default now()`.

### Audit / actor columns

The existing schema uses `created_by_user_id text not null` to record the Clerk user ID (TEXT, not UUID). Mirror this convention rather than referencing a UUID column.

For optional actor references in history tables: `<role>_user_id text` (nullable).

### Column Naming
- Foreign keys: `<entity>_id` (e.g., `cattle_id`, `organization_id`).
- Booleans: `is_*` prefix (e.g., `is_pregnant`, `is_archived`).
- Status: always `status`, never `state`.
- Decimal-precise data: `numeric(<precision>,<scale>)` (e.g., `weight_kg numeric(6,2)`).

### Soft delete

The cattle schema currently uses status enums (`deceased`, `sold`) rather than a `deleted_at` column. Don't introduce `deleted_at` unless the domain genuinely needs separate "deleted but still exists" semantics — extend the status enum instead.

---

## Data Types

| Use case | Type |
|----------|------|
| Primary keys | `uuid primary key default uuid_generate_v4()` |
| Clerk user/org IDs | `text not null` |
| Free text | `text` (nullable) or `text not null` |
| Timestamps | `timestamptz not null default now()` |
| Counts / ages | `integer` |
| Weight, milk yield, etc. | `numeric(<precision>,<scale>)` |
| Dates without time | `date` |
| Flexible data | `jsonb default '{}'::jsonb` |
| Flexible arrays | `jsonb default '[]'::jsonb` |
| Booleans | `boolean not null default false` |

JSONB always initialized with a default, never nullable.

---

## Enum Patterns

**Formal Postgres enum types** are the convention here (matches the init migration):

```sql
do $$ begin
  create type <name>_enum as enum ('value_one', 'value_two');
exception when duplicate_object then null; end $$;
```

- Wrap in the `do $$ ... exception when duplicate_object` block so re-running the migration is safe.
- Values: **lowercase snake_case** strings (`'active'`, `'born_on_farm'`, `'female'`). Matches the existing `status_enum`, `gender_enum`, `breed_enum`, `acquisition_enum`. Do NOT use UPPERCASE.
- Define enums BEFORE the table that uses them.

If you anticipate the enum changing often (e.g., adding new breeds), a `text` column with a `check (value in (...))` constraint is also acceptable — but the existing schema uses real enum types, so prefer that for consistency.

---

## Foreign Key Patterns

| Relationship | ON DELETE behavior |
|--------------|-------------------|
| Organization ownership | `on delete cascade` |
| Child table tied to parent (status_history → cattle) | `on delete cascade` |
| Optional actor (`changed_by_user_id`) | nullable, no `references` since Clerk IDs aren't FK-able |
| Optional FK to another row in this DB | `on delete set null` |

---

## Junction Tables

Junction-table template (for future many-to-many relationships):

```sql
create table if not exists <left>_<right> (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  <left>_id       uuid not null references <left>(id)  on delete cascade,
  <right>_id      uuid not null references <right>(id) on delete cascade,
  created_at      timestamptz not null default now(),
  constraint <left>_<right>_unique unique (<left>_id, <right>_id)
);

create index if not exists <left>_<right>_<left>_idx  on <left>_<right> (<left>_id);
create index if not exists <left>_<right>_<right>_idx on <left>_<right> (<right>_id);
create index if not exists <left>_<right>_org_idx    on <left>_<right> (organization_id);
```

- Always include `organization_id` for org-scoping in code.
- Always add a UNIQUE constraint on the (left_id, right_id) pair.
- No `updated_at` — junctions are insert/delete only.

---

## RLS — NOT used here

**This project does not use Row-Level Security.** Org-scoping is enforced at the application layer in `apps/web/lib/server/<domain>.ts` via `.eq("organization_id", organizationId)`. Server code uses `createAdminClient()` which bypasses RLS by design.

Do not add `alter table ... enable row level security` or any `create policy` statements unless the user explicitly wants to switch the project off the admin client. That would also require rewriting every function in `lib/server/` to use the user-scoped client and propagating Clerk JWTs into Supabase.

---

## Index Patterns

### Naming: `<table>_<column>_idx` (matches the init migration)

**Single column:**
```sql
create index if not exists <table>_<column>_idx on <table> (<column>);
```

**Composite:**
```sql
create index if not exists <table>_<col1>_<col2>_idx on <table> (<col1>, <col2>);
```

**Required indexes for org-owned tables:**
- `<table>_organization_id_idx` — always.
- Any column used in `.eq()` / `.ilike()` filters inside `apps/web/lib/server/<domain>.ts`.

Use `if not exists` for idempotency.

---

## Unique Constraints

Scoped uniqueness (e.g. "tag_number unique within an org") goes inside the `create table` statement, named for clarity:

```sql
constraint cattle_tag_unique_per_org unique (organization_id, tag_number)
```

The server-side code in `apps/web/lib/server/<domain>.ts` then catches Postgres error code `23505` and throws a domain-specific error (e.g. `CattleDuplicateTagError`). Keep the names predictable — the format `<table>_<col>_unique_per_org` is the convention.

---

## ALTER TABLE Patterns

**Adding columns:**
```sql
alter table <table_name>
  add column if not exists <column> <type> <default>;
```

- Always `if not exists` for idempotency.
- For NOT NULL columns added to a table with existing rows, supply a `default` so the migration doesn't fail.
- Add the matching index in the same migration file.

**Dropping columns** (rare — confirm first):
```sql
alter table <table_name>
  drop column if exists <column>;
```

---

## After running a migration

1. Apply locally:
   ```
   pnpm --filter @repo/database db:reset      # nuke + reapply everything
   # OR
   pnpm --filter @repo/database db:push       # apply pending only against remote
   ```
   (Check `packages/database/package.json` for the actual script names.)
2. Regenerate the TypeScript types (script also in `packages/database/package.json`).
3. Update the matching Zod schema in `apps/web/models/<domain>.ts`.
4. Update create/update calls in `apps/web/lib/server/<domain>.ts` to include the new column.
5. Run `pnpm --filter web build` to verify the new types compile.
