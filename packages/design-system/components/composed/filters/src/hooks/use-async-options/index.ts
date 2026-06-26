"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FilterAsyncOptions, FilterOption } from "../../types";

interface UseAsyncOptionsState<T> {
  cursor: number | string | undefined;
  error: Error | null;
  hasMore: boolean;
  isFetchingMore: boolean;
  isLoading: boolean;
  options: FilterOption<T>[];
  search: string;
}

const INITIAL_STATE = <T>(): UseAsyncOptionsState<T> => ({
  cursor: undefined,
  error: null,
  hasMore: false,
  isFetchingMore: false,
  isLoading: false,
  options: [],
  search: "",
});

interface UseAsyncOptionsParams<T> {
  // The async source declared on the field. Must be referentially stable
  // (wrap your loader in useCallback) — the hook stores the latest reference
  // in a ref, so changing identity does not retrigger fetches.
  asyncOptions: FilterAsyncOptions<T>;
  // When the popover is closed we tear down state so the next open starts
  // with a fresh search and first page.
  enabled: boolean;
}

const DEFAULT_DEBOUNCE_MS = 250;

// Internal state machine for an async-driven options popover. Owns:
//   - debounced search input
//   - one-page-at-a-time pagination via `loadMore`
//   - error state with retry
//   - reset on enable/disable (popover open/close)
//
// Aborts and request cancellation are intentionally NOT implemented: a stale
// page may briefly land in state, but the next user action replaces it.
export function useAsyncOptions<T>({
  asyncOptions,
  enabled,
}: UseAsyncOptionsParams<T>) {
  const [state, setState] = useState<UseAsyncOptionsState<T>>(INITIAL_STATE<T>);

  // Latest-loader ref so re-renders don't retrigger effects.
  const loadRef = useRef(asyncOptions.load);
  loadRef.current = asyncOptions.load;

  // Latest-state ref so callbacks can read current cursor/search without
  // depending on state in their closure.
  const stateRef = useRef(state);
  stateRef.current = state;

  const debounceMs = asyncOptions.debounceMs ?? DEFAULT_DEBOUNCE_MS;

  const loadFirstPage = useCallback(async (search: string) => {
    setState((s) => ({
      ...s,
      error: null,
      isLoading: true,
      options: [],
      cursor: undefined,
      hasMore: false,
    }));
    try {
      const result = await loadRef.current({ search });
      setState((s) => ({
        ...s,
        options: result.options,
        cursor: result.nextCursor,
        hasMore: result.nextCursor !== undefined,
        isLoading: false,
      }));
    } catch (err) {
      setState((s) => ({
        ...s,
        error: err instanceof Error ? err : new Error(String(err)),
        isLoading: false,
      }));
    }
  }, []);

  const loadMore = useCallback(async () => {
    const current = stateRef.current;
    if (current.isLoading || current.isFetchingMore || !current.hasMore) {
      return;
    }
    setState((s) => ({ ...s, isFetchingMore: true }));
    try {
      const result = await loadRef.current({
        cursor: current.cursor,
        search: current.search,
      });
      setState((s) => ({
        ...s,
        options: [...s.options, ...result.options],
        cursor: result.nextCursor,
        hasMore: result.nextCursor !== undefined,
        isFetchingMore: false,
      }));
    } catch (err) {
      setState((s) => ({
        ...s,
        error: err instanceof Error ? err : new Error(String(err)),
        isFetchingMore: false,
      }));
    }
  }, []);

  const setSearch = useCallback((search: string) => {
    setState((s) => ({ ...s, search }));
  }, []);

  const retry = useCallback(() => {
    loadFirstPage(state.search);
  }, [loadFirstPage, state.search]);

  // Reset when the popover closes.
  useEffect(() => {
    if (!enabled) {
      setState(INITIAL_STATE<T>());
    }
  }, [enabled]);

  // While open: run an initial fetch with empty search; on subsequent search
  // changes, debounce. The empty-search path runs synchronously (no debounce)
  // so the popover doesn't show a blank list during the first 250ms.
  useEffect(() => {
    if (!enabled) {
      return;
    }
    if (state.search === "") {
      loadFirstPage("");
      return;
    }
    const handle = setTimeout(() => {
      loadFirstPage(state.search);
    }, debounceMs);
    return () => clearTimeout(handle);
  }, [state.search, enabled, debounceMs, loadFirstPage]);

  return {
    error: state.error,
    hasMore: state.hasMore,
    isFetchingMore: state.isFetchingMore,
    isLoading: state.isLoading,
    loadMore,
    options: state.options,
    retry,
    search: state.search,
    setSearch,
  };
}
