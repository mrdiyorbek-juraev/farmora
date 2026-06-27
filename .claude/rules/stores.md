---
paths: "apps/web/stores/**"
---

# Store Rules

`apps/web/stores/` holds Zustand stores for global UI state — primarily the modal store at `stores/shared/modal-store.ts`.

## Invariants

- Single `setStore` / `setModal` setter pattern with a named `StateCreator`. Don't sprinkle ad-hoc setters per field.
- Export `initialXxx` so the store can be reset cleanly.
- Don't put server-derived data in Zustand — that belongs in React Query. Stores are for UI state (modal open flags, panel collapse, transient form data that survives navigation).
- `persist` middleware only when state genuinely needs to survive a reload (theme, sidebar collapse). Modal state should NOT be persisted.
- Don't prop-drill values that are already in a store — read from the store directly in the consumer.
