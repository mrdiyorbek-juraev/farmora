-- Cattle Management — activity tracking
-- Append-only audit log of meaningful events across the org. Each row
-- records who did what, optionally to which animal, with a structured
-- metadata payload for the details.
-- Apply locally with: pnpm --filter @repo/database db:reset
-- Apply to remote with: pnpm --filter @repo/database db:push

create extension if not exists "uuid-ossp";

-- ─── ENUMS ─────────────────────────────────────────────────────────

do $$ begin
  create type activity_type_enum as enum (
    'cattle_created',
    'cattle_updated',
    'cattle_deleted',
    'status_changed',
    'weight_recorded',
    'note_added',
    'member_added',
    'member_removed',
    'organization_updated'
  );
exception when duplicate_object then null; end $$;

-- ─── activities — org-scoped audit log ─────────────────────────────

create table if not exists activities (
  id               uuid primary key default uuid_generate_v4(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  -- Clerk user who triggered the event; null for system-generated entries.
  actor_user_id    text,
  -- Optional subject animal. set null (not cascade) so deleting an animal
  -- keeps the org's history intact — the tag is snapshotted in metadata.
  cattle_id        uuid references cattle(id) on delete set null,
  type             activity_type_enum not null,
  -- Short human-readable summary, e.g. "Bessie (#014) marked sick".
  title            text not null,
  -- Optional longer detail.
  description      text,
  -- Structured payload: old/new values, tag snapshots, etc.
  metadata         jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now()
);

create index if not exists activities_organization_id_idx on activities (organization_id);
create index if not exists activities_cattle_id_idx        on activities (cattle_id);
create index if not exists activities_type_idx             on activities (type);
-- Drives the recent-activity feed: filter by org, newest first.
create index if not exists activities_org_created_at_idx
  on activities (organization_id, created_at desc);

-- No updated_at / trigger: activity rows are immutable once written.
