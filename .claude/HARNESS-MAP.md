# Cattle Management — Claude Harness Map

> Quick reference for what lives where in the `.claude/` config and when to update each piece.

## Repository structure

```
cattle-management/
├── .claude/                       ← Monorepo-wide Claude config
│   ├── CLAUDE.md                  ← Master rules, repo invariants, skills table
│   ├── HARNESS-MAP.md             ← This file
│   ├── launch.json                ← VSCode launch configs for dev servers
│   ├── rules/                     ← Path-scoped coding rules (auto-loaded by dir)
│   ├── agents/                    ← Subagent definitions (migration-generator, etc.)
│   ├── skills/                    ← Invokable workflows (/feature, /fix, /tdd, etc.)
│   ├── hooks/                     ← Hook scripts (session-context, post-edit-lint, etc.)
│   ├── scripts/                   ← Bash validation script
│   ├── agent-memory/              ← Subagent persistent memory (auto-generated)
│   └── output-styles/             ← Output formatting preferences
│
├── apps/
│   ├── web/                       ← Next.js 16 — the actual product
│   │   └── .claude/               ← App-specific harness (workspace CLAUDE.md, contracts, patterns)
│   ├── docs/                      ← Mintlify docs
│   └── storybook/                 ← Component showcase
│
├── packages/                      ← 11 @repo/* packages
│   └── database/
│       └── supabase/migrations/   ← All SQL migrations (single dir)
│
├── pnpm-workspace.yaml
└── turbo.json
```

---

## Tech-stack quick-reference

| Concern | Choice | Notes |
|---------|--------|-------|
| Framework | Next.js 16, App Router, Turbopack | React 19 |
| Auth | Clerk (`@clerk/nextjs`) | User → Organization → Membership |
| Database | Supabase | Single migration in `packages/database/supabase/migrations/` |
| DB access from server | `createAdminClient()` from `@repo/database/admin` | Bypasses RLS — org-scoping is in code |
| Data fetching (client) | React Query (`@tanstack/react-query`) | Mutations + cache invalidation |
| Server API surface | Server Actions in `apps/web/app/_actions/*.ts` | **No `app/api/*/route.ts` files** |
| Forms | Formik + Zod | `zodValidate(schema)` from `@/lib/forms/zod-validate` |
| UI components | `@repo/design-system/components/ui/*` (shadcn/Radix) | Tailwind v4, `lucide-react` icons |
| Global UI state | Zustand (`apps/web/stores/*`) | Modal store at `stores/shared/modal-store.ts` |
| Tests | Vitest (unit), Playwright (E2E) | `pnpm --filter web test`, `test:e2e` |
| **Not present** | Inngest, Supabase Realtime, RLS, message queues, API routes | Don't propose these without asking first |

---

## Layered Claude config

| Layer | Loaded when | What it covers |
|-------|-------------|----------------|
| Root `.claude/CLAUDE.md` | Every session | Repo invariants, code standards, skills, agents |
| `apps/web/.claude/CLAUDE.md` | Working in `apps/web/**` | App-specific invariants, sub-path conventions |
| `.claude/rules/*` (path-scoped) | Touching matching files | "Do this, not that" |
| `.claude/agents/*` | When subagent is spawned | Agent persona + procedures |
| `.claude/skills/*` | When `/<name>` is invoked | Workflow prompts |
| `.claude/hooks/*` | Editor/CI events | Deterministic checks |

---

## Update triggers

| When you... | Update... |
|------------|-----------|
| Add a new package under `packages/` | Repo-glance section in root `CLAUDE.md`, `rules/packages.md` if conventions change |
| Add a server action | No config change needed — pattern is documented in `apps/web/.claude/CLAUDE.md` |
| Add a Supabase migration | `agent-memory/migration-generator/MEMORY.md` if you discover a new convention |
| Add a new coding pattern | Add a rule to `.claude/rules/` (use path-scoped frontmatter) |
| Add a workflow | Add a skill under `.claude/skills/<name>/SKILL.md` and reference it in the root `CLAUDE.md` skills table |
| Discover a project-specific gotcha | Drop a note in the relevant rule file with `**Why:**` so the reason survives |

---

## Skills

| Command | What it does |
|---------|-------------|
| `/feature <desc>` | Full feature workflow: research, plan, implement, verify |
| `/fix <bug>` | Bug fix workflow |
| `/tdd <behavior>` | Test-driven development (RED → GREEN → REFACTOR) |
| `/refactor <goal>` | Refactoring workflow |
| `/review <scope>` | Code review |
| `/database-patterns` | Supabase migration patterns + conventions |
| `/visual-qa` | Browser-based visual QA |
| `/commit-push-pr` | Commit, push, open PR (user-only invocation) |
| `/autopilot-loop` | Autonomous iterative delivery cycle (user-only) |

---

## Compaction discipline

When the conversation gets long, keep: file paths touched, the current task, test commands, error messages being debugged, in-flight plans. Drop: file contents, intermediate tool output, exploration notes that didn't change anything.
