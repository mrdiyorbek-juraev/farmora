# apps/web — Cattle Management (Next.js 16)

> For monorepo-wide standards (Ultracite, async rules, JS perf rules), see the root `.claude/CLAUDE.md`. This file covers what's specific to the web app.

**Stack:** Next.js 16 (App Router + Turbopack), React 19, Clerk auth, Supabase (admin client, no RLS), React Query, Formik + Zod, Tailwind v4, `@repo/design-system` (shadcn).

## Directory map

```
apps/web/
├── app/                          ← Next.js App Router
│   ├── _actions/                 ← Server actions (`"use server"`) — the entire API surface
│   ├── (auth)/, (main)/, ...     ← Page routes
│   └── layout.tsx, providers/    ← Root layout + ClerkProvider/QueryClient wiring
├── lib/
│   ├── server/                   ← Server-only DB/business logic (called by _actions)
│   ├── forms/                    ← Form helpers (e.g. zod-validate.ts)
│   └── utils/                    ← Shared client helpers
├── models/                       ← Zod schemas + form-value converters (per domain)
├── services/                     ← Client-side React Query hooks (mutations, queries)
├── stores/                       ← Zustand stores (modals, global UI state)
├── views/                        ← Page-level UI compositions
└── components/                   ← Reusable UI building blocks
```

## Core invariants

These are non-negotiable. They reflect how this codebase is actually wired.

### Auth + data scoping
- Every server action MUST call `getCurrentOrganization()` (`lib/server/organization.ts`) before any DB work. It returns `{ organization, userId, membership }` and does JIT user/org provisioning from the Clerk session.
- DB queries MUST be scoped by `organization_id` at the `.eq()` level. There is **no RLS** — the admin client bypasses it. Org-scoping is enforced in code.
- Never call `createAdminClient()` from a Client Component or from a route handler that isn't `"use server"`.

### Server actions are the only backend
- All mutations and queries from the client go through `apps/web/app/_actions/<domain>.ts`.
- **There are no `app/api/*/route.ts` files** in this project. Don't add any.
- Each action: validate input with the Zod schema from `models/<domain>.ts`, call `getCurrentOrganization()`, delegate to a function in `lib/server/<domain>.ts`. Mirror the existing pattern in `app/_actions/cattle.ts`.
- Server-side DB code lives in `lib/server/<domain>.ts` and starts with `import "server-only";`.

### Forms
- **Formik + Zod** is the standard. Validation runs through `zodValidate(schema)` from `@/lib/forms/zod-validate`.
- Form-value shapes live in `models/<domain>.ts` as `<domain>FormSchema` / `<domain>FormValues`, with a `<domain>FormToCreateInput()` transformer that produces the typed action input.
- Required-field UX: required selects use `""` as the empty sentinel and rely on a `.min(1, "...required")` refinement that pipes into the enum.

### UI components
- Use `@repo/design-system/components/ui/*` — never raw `<button>`, `<input>`, `<select>`, `<dialog>`.
- For compound inputs (icon, button, or addon next to an input), use `InputGroup` + `InputGroupInput` + `InputGroupAddon` + `InputGroupButton` from `@repo/design-system/components/ui/input-group`. Don't hand-roll the wrapper.
- Icons: `lucide-react` only.
- `cn()` from `@repo/design-system/lib/utils` for class merging.
- Don't define components inside other components. Extract subcomponents at module scope so hooks can be called normally.

### Models / Zod
- All input/output schemas belong in `models/<domain>.ts` colocated with their domain.
- Export both the schema (`fooSchema`) and the inferred type (`Foo`).
- For server-action inputs, use `z.input<>` for client-facing types (pre-coercion) and `z.infer<>` for post-validation server-side types.

### Errors
- Define domain-specific error classes next to the server helpers (`lib/server/<domain>.ts`). See `CattleDuplicateTagError`, `CattleNotFoundError`, `CattleQueryError`.
- In React Query mutations, let the toast layer in `services/<domain>/mutations.ts` surface errors. Don't catch and swallow inside the form.

---

## Sub-paths and what to expect

### `app/_actions/<domain>.ts`
Top of file: `"use server";`. One function per action. Each:
1. Parse the input with the Zod schema from `@/models/<domain>`.
2. `const { organization, userId } = await getCurrentOrganization();`
3. Delegate to a `lib/server/<domain>.ts` function with `organization.id` and the parsed input.

### `lib/server/<domain>.ts`
Top of file: `import "server-only";`. Functions take `organizationId: string` as the first argument so org-scoping is impossible to forget. Use `createAdminClient()` from `@repo/database/admin`. Throw domain errors (`CattleDuplicateTagError`, etc.) — let the caller decide how to surface them. Catch Postgres unique violations via `error.code === "23505"`.

### `models/<domain>.ts`
- `<domain>Schema` — the persisted row shape (mirrors the DB columns).
- `create<Domain>InputSchema`, `update<Domain>InputSchema`, etc. — server-action inputs.
- `<domain>FormSchema`, `<domain>FormInitialValues`, `<domain>FormToCreateInput()` — form-side schemas and converters.
- Inferred types exported at the bottom.

### `services/<domain>/mutations.ts`
React Query mutation hooks. Owns toast and cache invalidation. Components import `useCattleMutations()` and call `onCreate.mutateAsync(...)`.

### `stores/shared/modal-store.ts`
Zustand store for global modals. Pages call `setModal({ animalForm: { open: true, props: row } })`; the modal reads `animalForm.open / animalForm.props` from the store. The `props` slot carries the row when editing, `null` when creating.

### `views/<area>/...`
Page-level UI. Modals live under `views/<area>/modals/<name>/index.tsx` as a single file (Formik + fields). No `customs/header|body|footer` split — the project uses a flat single-file modal.

---

## Things that aren't here

Don't suggest these — there's no infrastructure for them in this project:

- **Inngest** or any background job runner
- **Supabase Realtime** or broadcast channels
- **RLS policies** (org-scoping is in code)
- **API route handlers** (`app/api/.../route.ts`) — server actions only
- **`@psy/*` packages** — this repo uses `@repo/*`

If a task seems to need any of these, surface the gap rather than scaffold an alternative — the user will decide whether to wire them up.

---

## Common task recipes

### Add a new server action
1. Add Zod schema to `models/<domain>.ts` (input + inferred type).
2. Add a function to `lib/server/<domain>.ts` that takes `organizationId` first.
3. Wrap it in `apps/web/app/_actions/<domain>.ts`: parse, get org, delegate.
4. Add a React Query mutation in `services/<domain>/mutations.ts` if it's called from the UI.

### Add a column / table
1. Create the migration: `cd packages/database && pnpm supabase migration new <snake_name>`. (Or hand-write a timestamped file in `packages/database/supabase/migrations/` matching the existing init file's style — `uuid_generate_v4()` from `uuid-ossp`, lowercase enum values, snake_case columns, `created_at/updated_at` timestamptz.)
2. Update `models/<domain>.ts` schemas to include the new column.
3. Update `lib/server/<domain>.ts` insert/update calls.
4. Update the form (`views/...`) if it's user-editable.

### Add a form field
1. Extend `models/<domain>.ts`: form schema, initial values, transformer.
2. Add a `<FastField name="...">` block in the modal, mirroring the existing tag/name/breed examples.
3. If the field needs server validation (uniqueness, etc.), add a check action in `app/_actions/<domain>.ts` plus the helper in `lib/server/<domain>.ts`.
