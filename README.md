# 🐄 Farmora — Cattle Management

A farm-facing **cattle management** application for tracking herds, animal records, weights, status changes, and farm activity — built as a Next.js + Supabase + Clerk monorepo.

## Overview

Farmora helps farms manage their livestock from a single dashboard: register animals, track breed/status/weight over time, record weigh-ins, and keep an audited activity log — all scoped per organization.

The repo is a [Turborepo](https://turborepo.com) monorepo. The product surface is the web app at `apps/web/`; `apps/docs/` and `apps/storybook/` are secondary.

## Tech stack

| Area | Choice |
|------|--------|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| UI | React 19.2, [Tailwind CSS v4](https://tailwindcss.com), shadcn/Radix design system |
| Auth | [Clerk](https://clerk.com) — User → Organization → Membership |
| Database | [Supabase](https://supabase.com) (Postgres) via the admin client |
| Data layer | Server Actions + [React Query](https://tanstack.com/query) on the client |
| Forms | [Formik](https://formik.org) + [Zod](https://zod.dev) |
| Tooling | pnpm + Turborepo, [Ultracite](https://www.ultracite.ai/) (Biome) for lint/format |
| Testing | [Vitest](https://vitest.dev) (unit), [Playwright](https://playwright.dev) (e2e) |

## Architecture invariants

These shape every file in the web app:

- **Auth & scoping:** Clerk provides the `User → Organization → Membership` model. All data is **org-scoped at the query level** (`.eq("organization_id", …)`) — there is **no RLS**; the admin client bypasses it, so code-level scoping is the only tenant boundary.
- **Server Actions are the only backend.** There are **no `app/api/*/route.ts` files**. Client mutations/queries go through `apps/web/app/_actions/<domain>.ts`, which validate input with a Zod schema, call `getCurrentOrganization()`, then delegate to server-only logic in `apps/web/lib/server/<domain>.ts`.
- **Migrations** live in a single timestamped directory: `packages/database/supabase/migrations/`.
- **Not wired up:** no Inngest, no Supabase Realtime, no message queue.

## Repository structure

```
apps/
├── web/         ← Next.js 16 app — the product (port 3000)
├── docs/        ← Mintlify documentation
└── storybook/   ← Component showcase

packages/
├── ai/                    ← @repo/ai — OpenAI SDK + streaming
├── auth/                  ← @repo/auth — Clerk wrapper
├── database/              ← @repo/database — Supabase clients + migrations + types
├── design-system/         ← @repo/design-system — shadcn/Radix UI + Tailwind v4
├── internationalization/  ← @repo/internationalization
├── next-config/           ← @repo/next-config — shared Next config
├── rate-limit/            ← @repo/rate-limit — Upstash
├── security/              ← @repo/security — Arcjet
├── seo/                   ← @repo/seo
├── storage/               ← @repo/storage — Vercel Blob
└── typescript-config/     ← @repo/typescript-config
```

### Web app layout (`apps/web/`)

```
app/_actions/   ← Server actions ("use server") — the entire API surface
lib/server/     ← Server-only DB/business logic (import "server-only")
models/         ← Zod schemas + form converters (per domain)
services/       ← Client-side React Query hooks (mutations, queries)
stores/         ← Zustand stores (modals, global UI state)
views/          ← Page-level UI compositions
components/     ← Reusable UI building blocks
```

## Domain model

The Supabase schema (`packages/database/supabase/migrations/`) centers on two hubs — **organizations** (the tenant root) and **cattle**:

- `organizations` — tenant root, mirrored from Clerk orgs
- `memberships` — Clerk users mapped into an organization (`admin` / `member`)
- `cattle` — animals: tag, breed, gender, status, weight, acquisition
- `status_history` — audit trail of every status change per animal
- `weight_measurements` — point-in-time weigh-ins driving the weight chart
- `activities` — org-wide activity log (cattle created/updated, status changes, etc.)

## Getting started

### Prerequisites

- Node.js 20+
- pnpm 10+ (`packageManager` is pinned in `package.json`)
- A Supabase project and a Clerk application

### Install

```sh
pnpm install
```

### Environment

Copy the example env and fill in Clerk + Supabase credentials:

```sh
cp apps/web/.env.example apps/web/.env.local
```

### Run the web app

```sh
pnpm --filter web dev      # http://localhost:3000
```

## Common commands

| Task | Command |
|------|---------|
| Web dev server | `pnpm --filter web dev` |
| Web production build | `pnpm --filter web build` |
| Build everything | `pnpm build` |
| Format code | `pnpm dlx ultracite fix` |
| Check lint/format | `pnpm dlx ultracite check` |
| Unit tests | `pnpm --filter web test` |
| E2E tests | `pnpm --filter web test:e2e` |

### Database

```sh
# Create a new migration (correct timestamp prefix)
cd packages/database && pnpm supabase migration new <snake_case_name>

# Apply migrations to a local Supabase
pnpm --filter @repo/database db:reset
```

Conventions: lowercase enum values, `uuid_generate_v4()` from `uuid-ossp`, `organization_id` FK on every org-owned table, and **no RLS**.

## Contributing conventions

Project-wide standards (type safety, async patterns, component/server-action rules) live in [`.claude/CLAUDE.md`](.claude/CLAUDE.md) and the rule files under `.claude/rules/`. Web-app specifics are in [`apps/web/.claude/CLAUDE.md`](apps/web/.claude/CLAUDE.md). Ultracite (Biome) enforces formatting and most linting automatically.
