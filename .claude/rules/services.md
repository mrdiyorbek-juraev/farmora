---
paths: "apps/web/services/**"
---

# Service Layer Rules

`apps/web/services/<domain>/` is the React Query layer that wraps server actions.

## Invariants

- Service hooks use React Query — never raw `fetch()`.
- Server actions from `apps/web/app/_actions/<domain>.ts` are the only thing services call. Don't bypass them and hit Supabase from the client.
- Query keys come from a `keys.ts` factory (`cattleKeys.list(filters)`, `cattleKeys.detail(id)`). Don't inline string-array keys.
- Mutations own toasts (loading → success/error) and cache invalidation. Use `queryClient.invalidateQueries({ queryKey: cattleKeys.lists() })` after a successful mutation that affects the list.
- Mutation hooks expose a single object (e.g. `useCattleMutations()` returns `{ onCreate, onUpdate, onDelete }`) so callers can pull only what they need.
- For paginated lists: `useInfiniteQuery` with `initialPageParam: 0` (offset-based) and a `getNextPageParam` that returns the next offset when more rows remain.
