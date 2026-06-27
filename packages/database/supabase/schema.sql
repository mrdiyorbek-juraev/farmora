-- Cattle Management — current schema snapshot (read-only reference)
-- Source of truth: packages/database/supabase/migrations/
-- Apply locally: pnpm --filter @repo/database db:reset
-- Apply to remote: pnpm --filter @repo/database db:push

-- This file is regenerated from migrations and exists for grep-ability.
-- Do not hand-edit; create a new migration instead.

create extension if not exists "uuid-ossp";

-- ENUMS
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

do $$ begin
  create type activity_type_enum as enum (
    'cattle_created', 'cattle_updated', 'cattle_deleted', 'status_changed',
    'weight_recorded', 'note_added', 'member_added', 'member_removed',
    'organization_updated'
  );
exception when duplicate_object then null; end $$;

create table if not exists organizations (
  id            uuid primary key default uuid_generate_v4(),
  clerk_org_id  text unique not null,
  name          text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

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

create table if not exists status_history (
  id                   uuid primary key default uuid_generate_v4(),
  cattle_id            uuid not null references cattle(id) on delete cascade,
  changed_by_user_id   text,
  from_status          status_enum,
  to_status            status_enum not null,
  changed_at           timestamptz not null default now(),
  note                 text
);

create table if not exists activities (
  id               uuid primary key default uuid_generate_v4(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  actor_user_id    text,
  cattle_id        uuid references cattle(id) on delete set null,
  type             activity_type_enum not null,
  title            text not null,
  description      text,
  metadata         jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now()
);
