-- Cattle Management System — Supabase schema
-- Run in Supabase SQL editor (or `supabase db reset` once migrations are wired)

create extension if not exists "uuid-ossp";

-- ENUMS — constrained values keep aggregations clean
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

-- farmers — synced from Clerk auth
create table if not exists farmers (
  id              uuid primary key default uuid_generate_v4(),
  clerk_user_id   text unique not null,
  email           text unique not null,
  full_name       text,
  farm_name       text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists farmers_clerk_user_id_idx on farmers (clerk_user_id);

-- cattle — the core entity
create table if not exists cattle (
  id              uuid primary key default uuid_generate_v4(),
  farmer_id       uuid not null references farmers(id) on delete cascade,
  tag_number      text not null,
  name            text,
  breed           breed_enum not null,
  gender          gender_enum not null,
  date_of_birth   date not null,
  status          status_enum not null default 'active',
  weight_kg       numeric(6,2),
  acquisition     acquisition_enum not null,
  acquired_date   date,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint cattle_tag_unique_per_farm unique (farmer_id, tag_number)
);

create index if not exists cattle_farmer_id_idx on cattle (farmer_id);
create index if not exists cattle_status_idx    on cattle (status);
create index if not exists cattle_breed_idx     on cattle (breed);

-- status_history — audit trail (stub for now; populated on every status change later)
create table if not exists status_history (
  id           uuid primary key default uuid_generate_v4(),
  cattle_id    uuid not null references cattle(id) on delete cascade,
  from_status  status_enum,
  to_status    status_enum not null,
  changed_at   timestamptz not null default now(),
  note         text
);

create index if not exists status_history_cattle_id_idx on status_history (cattle_id);

-- updated_at trigger
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists farmers_set_updated_at on farmers;
create trigger farmers_set_updated_at
  before update on farmers
  for each row execute function set_updated_at();

drop trigger if exists cattle_set_updated_at on cattle;
create trigger cattle_set_updated_at
  before update on cattle
  for each row execute function set_updated_at();
