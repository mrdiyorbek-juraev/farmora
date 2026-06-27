-- Cattle Management — weight measurements
-- Point-in-time weight records for each animal. Drives the weight-history
-- chart and table on the cattle detail page. Weights are stored in kg;
-- the UI converts to lb for display only.
-- The activity log entry (type = 'weight_recorded') is written separately
-- by the server action — no trigger needed here.
-- Apply locally with: pnpm --filter @repo/database db:reset
-- Apply to remote with: pnpm --filter @repo/database db:push

create extension if not exists "uuid-ossp";

-- ─── weight_measurements ───────────────────────────────────────────

create table if not exists weight_measurements (
  id                   uuid primary key default uuid_generate_v4(),
  organization_id      uuid not null references organizations(id) on delete cascade,
  cattle_id            uuid not null references cattle(id) on delete cascade,
  -- Clerk user who recorded the measurement; nullable for system imports.
  recorded_by_user_id  text,
  -- Stored in kg. check keeps out zero and values above the numeric ceiling.
  weight_kg            numeric(6,2) not null check (weight_kg > 0 and weight_kg <= 9999.99),
  -- Calendar date the animal was physically weighed (not the insert timestamp).
  measured_at          date not null,
  note                 text,
  created_at           timestamptz not null default now()
  -- No updated_at: weight measurements are point-in-time facts, not updated.
);

create index if not exists weight_measurements_organization_id_idx
  on weight_measurements (organization_id);

create index if not exists weight_measurements_cattle_id_idx
  on weight_measurements (cattle_id);

-- Drives ORDER BY measured_at on the per-animal weight chart and history table.
create index if not exists weight_measurements_cattle_id_measured_at_idx
  on weight_measurements (cattle_id, measured_at);
