---
paths: "apps/web/components/**", "apps/web/views/**"
---

# Component Rules

When working on UI components in `apps/web/components/**` or `apps/web/views/**`:

## Invariants

- Use `@repo/design-system/components/ui/*` — never raw `<button>`, `<input>`, `<select>`, `<dialog>`, `<table>`.
- For compound inputs (icon, button, or addon next to an input) use `InputGroup` from `@repo/design-system/components/ui/input-group`. Don't hand-roll a wrapper div with absolute positioning.
- Icons come from `lucide-react`.
- Class merging via `cn()` from `@repo/design-system/lib/utils`.
- **Don't define a component inside another component.** Extract subcomponents to module scope so hooks work normally.
- Hooks called at the top of the component only — never inside a render-prop callback (FastField, Formik). If a render-prop body needs to call hooks, extract a subcomponent that receives the render-prop's args as props.
- Loading / error / empty states are required when fetching data. Use the design-system's `Skeleton` / `Empty` primitives instead of inline spinners.
- Static data (option arrays, breeds, statuses, etc.) lives in `apps/web/mocks/<domain>/*.ts` or `apps/web/constants/*.ts`. Don't define static arrays at the top of a component file unless they're trivially small AND component-local.
- Form fields use Formik + Zod. Validate with `zodValidate(schema)` from `@/lib/forms/zod-validate`. Schemas live in `apps/web/models/<domain>.ts`.
- Modals follow the flat single-file pattern under `views/<area>/modals/<name>/index.tsx` — Formik + fields directly in one file, opened/closed via the global modal store (`@/stores/shared/modal-store`).
- React Query mutations (and their toast/cache-invalidation side effects) live in `apps/web/services/<domain>/mutations.ts`. Components call hooks like `useCattleMutations()` and use `mutation.mutateAsync(input)` — they don't catch+swallow errors.
