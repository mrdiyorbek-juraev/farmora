import type { SortRule } from "../types";

// ─── Server sort wire shape ──────────────────────────────────────────
//
// Mirrors the FE `SortRule` minus the presentation `id`. The wire
// payload is an array because we ship multi-priority sort: the BE
// chains `.order(field, { ascending })` calls in the order they
// appear, so position 0 is the primary sort, position 1 is the
// tiebreaker, etc.

export interface SortRuleWire {
  field: string;
  direction: "asc" | "desc";
}

export const getSortQueryBasedOnSort = <T = unknown>(
  sorts: SortRule<T>[]
): SortRuleWire[] =>
  sorts.map((s) => ({
    field: s.field,
    direction: s.direction,
  }));
