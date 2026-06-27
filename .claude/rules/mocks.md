---
paths: "apps/web/mocks/**", "apps/web/constants/**"
---

# Static Data Rules

Static, never-changing data (filter option lists, breed catalogues, status enums for UI) lives in `apps/web/mocks/<domain>/` or `apps/web/constants/`. Components import from there — never inline at the top of a TSX file.

## Invariants

- One file per logical grouping: `mocks/cattle/breed-options.ts`, `mocks/cattle/status-options.ts`.
- Data only — no JSX, no React components in a mocks/constants file.
- Export as named const arrays/objects, not default exports.
- The shape MUST match what the Zod schema in `apps/web/models/<domain>.ts` declares. If you add an enum value, update both the Zod schema and the mock at the same time.
- For dropdown options, prefer `{ value, label }` objects so the UI can render labels independently from the underlying value.
- Fallback values: `FALLBACK_<DOMAIN>_<FIELD>` (UPPER_SNAKE_CASE).
