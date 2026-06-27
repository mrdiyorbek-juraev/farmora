---
paths: "apps/web/types/**", "apps/web/models/**"
---

# Types & Models

This codebase splits typing responsibilities:

- `apps/web/models/<domain>.ts` — Zod schemas, inferred TS types, form-value transformers. **Most domain typing lives here.**
- `apps/web/types/<scope>.ts` — purely structural types that aren't tied to a Zod schema (e.g. UI prop helpers, generic utility types).

## Invariants for `models/<domain>.ts`

- Define the row schema first: `export const cattleSchema = z.object({...});` mirrors the DB columns one-to-one.
- Input schemas for server actions follow the row schema: `createCattleInputSchema`, `updateCattleInputSchema`, etc. They use `.partial()` / `.pick()` rather than redefining shapes.
- Form schemas (`cattleFormSchema`) live in the same file but treat every field as a string (empty strings are the neutral value for unfilled selects/inputs). Provide a `cattleFormToCreateInput()` transformer that takes a parsed form value and produces the action input.
- Export inferred types at the bottom: `export type CreateCattleInput = z.infer<typeof createCattleInputSchema>;`.
- Use `z.input<>` (pre-coercion) for client-facing types so the form can pass empty strings; use `z.infer<>` (post-validation) for everything that flows into the server.

## Invariants for `types/`

- Use `interface` for object shapes; use `type` for unions, intersections, mapped/conditional types, and aliases of primitives.
- No runtime code in `types/*.ts` — types only.
- Derive from Supabase generated types where possible: `Database["public"]["Tables"]["cattle"]["Row"]`. Generated types live in `@repo/database` exports.
- Junction types: `T<EntityA><EntityB> & { <entityB>: Partial<T<EntityB>> }`.
