-- Cattle Management — initial schema (org-as-tenant model)
-- Apply locally with: pnpm --filter @repo/database db:reset
-- Apply to remote with: pnpm --filter @repo/database db:push

create extension if not exists "uuid-ossp";

-- ─── ENUMS ─────────────────────────────────────────────────────────

do $$ begin
  create type status_enum as enum ('active', 'sick', 'pregnant', 'sold', 'deceased');
exception when duplicate_object then null; end $$;

do $$ begin
  create type gender_enum as enum ('female', 'male');
exception when duplicate_object then null; end $$;

do $$ begin
  create type breed_enum as enum (
    'holstein', 'jersey', 'angus', 'hereford', 'brown_swiss',
    'guernsey', 'charolais', 'simmental', 'other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type acquisition_enum as enum ('born_on_farm', 'purchased');
exception when duplicate_object then null; end $$;

do $$ begin
  create type membership_role_enum as enum ('admin', 'member');
exception when duplicate_object then null; end $$;

-- ─── organizations — mirrors Clerk Organizations ───────────────────

create table if not exists organizations (
  id            uuid primary key default uuid_generate_v4(),
  clerk_org_id  text unique not null,
  name          text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists organizations_clerk_org_id_idx on organizations (clerk_org_id);

-- ─── memberships — Clerk user ↔ organization, per-org user profile ─

create table if not exists memberships (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  clerk_user_id   text not null,
  email           text not null,
  full_name       text,
  role            membership_role_enum not null default 'member',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint memberships_user_org_unique unique (clerk_user_id, organization_id)
);

create index if not exists memberships_org_idx  on memberships (organization_id);
create index if not exists memberships_user_idx on memberships (clerk_user_id);

-- ─── cattle — org-scoped ───────────────────────────────────────────

create table if not exists cattle (
  id                  uuid primary key default uuid_generate_v4(),
  organization_id     uuid not null references organizations(id) on delete cascade,
  created_by_user_id  text not null,
  tag_number          text not null,
  name                text,
  breed               breed_enum not null,
  gender              gender_enum not null,
  date_of_birth       date not null,
  status              status_enum not null default 'active',
  weight_kg           numeric(6,2),
  acquisition         acquisition_enum not null,
  acquired_date       date,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint cattle_tag_unique_per_org unique (organization_id, tag_number)
);

create index if not exists cattle_organization_id_idx on cattle (organization_id);
create index if not exists cattle_status_idx          on cattle (status);
create index if not exists cattle_breed_idx           on cattle (breed);

-- ─── status_history — audit trail ──────────────────────────────────

create table if not exists status_history (
  id                   uuid primary key default uuid_generate_v4(),
  cattle_id            uuid not null references cattle(id) on delete cascade,
  changed_by_user_id   text,
  from_status          status_enum,
  to_status            status_enum not null,
  changed_at           timestamptz not null default now(),
  note                 text
);

create index if not exists status_history_cattle_id_idx on status_history (cattle_id);

-- ─── updated_at trigger ────────────────────────────────────────────

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists organizations_set_updated_at on organizations;
create trigger organizations_set_updated_at
  before update on organizations
  for each row execute function set_updated_at();

drop trigger if exists memberships_set_updated_at on memberships;
create trigger memberships_set_updated_at
  before update on memberships
  for each row execute function set_updated_at();

drop trigger if exists cattle_set_updated_at on cattle;
create trigger cattle_set_updated_at
  before update on cattle
  for each row execute function set_updated_at();
