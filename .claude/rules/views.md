---
paths: "apps/web/views/**"
---

# View Rules

`apps/web/views/<area>/` holds page-level compositions. Routes in `apps/web/app/(group)/.../page.tsx` are thin and import a view component.

## Invariants

- Views live in `views/<area>/<feature>/index.tsx`. Subcomponents that are only used by that view sit next to it.
- Read state from Zustand stores (`@/stores/...`) and React Query caches directly — don't prop-drill data the consumer can already read.
- Don't fetch directly in views — use the service hooks under `apps/web/services/<domain>/`. They wrap React Query and own the cache keys.
- Modal triggers go through the global modal store: `setModal({ animalForm: { open: true, props: row } })`. Modals themselves live under `views/<area>/modals/<name>/index.tsx`.
- Always render explicit `loading`, `error`, and `empty` branches when consuming React Query — don't rely on `null` returns to mean "loading".
- Page-level layout / spacing uses Tailwind utility classes; don't reach into the design-system to override Card / Dialog padding.
