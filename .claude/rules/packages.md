---
paths: "packages/**"
---

# Package Rules

When working in `packages/*` (shared `@repo/*` workspaces):

## Invariants

- Each package has its own `package.json` with explicit `exports`. Add new entry points there before importing them from `apps/web/`.
- Extend `@repo/typescript-config` for TS config (`base.json`, `nextjs.json`, etc.).
- **No app-specific logic in packages.** If it only makes sense for the cattle app, put it in `apps/web/lib/` instead.
- Don't import another package's internals — only its documented exports.
- Keep dependencies minimal — every dep in a package becomes a dep of every consumer.
- `packages/database/supabase/migrations/` is the single source of truth for schema. Don't add migration dirs elsewhere.
- `packages/database` exports clients via `@repo/database/admin` (server-only), `@repo/database/server`, `@repo/database/browser`. Never import the admin client from a client component.
- `packages/design-system` is the only place new shadcn-style components are added. Extend the component itself rather than override at the call site (`size` / `variant` props).
