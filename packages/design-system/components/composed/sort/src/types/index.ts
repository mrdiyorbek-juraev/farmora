import type { ReactNode } from "react";

// One active sort entry. Order in the array = sort priority.
// Named `SortRule` (not `Sort`) so the component can export `<Sort>` without
// colliding with this data type — mirrors how Filters has Filter the rule
// vs <Filters> the component.
export interface SortRule<T = unknown> {
  id: string;
  field: string;
  direction: "asc" | "desc";
  // Lets consumers stash the field's typed key for downstream use.
  // Untouched by the component itself.
  meta?: T;
}

export interface SortFieldConfig<T = unknown> {
  key: string;
  label: string;
  icon?: ReactNode;
  // Optional override of the direction option labels (e.g. "Newest first").
  ascendingLabel?: string;
  descendingLabel?: string;
  // Stash the field's typed key (mirrors Filter's `meta`).
  meta?: T;
}

export interface SortFieldGroup<T = unknown> {
  group?: string;
  fields: SortFieldConfig<T>[];
}

export type SortFieldsConfig<T = unknown> =
  | SortFieldConfig<T>[]
  | SortFieldGroup<T>[];

export interface SortI18nConfig {
  triggerEmpty: string; // "Sort"
  triggerSortedBy: string; // "Sorted by"
  searchPlaceholder: string; // "Search attributes…"
  noFieldsFound: string; // "No attributes found."
  addSort: string; // "+ Add sort"
  ascending: string; // "Ascending"
  descending: string; // "Descending"
  removeSort: string; // "Remove sort"
  learnAboutSorting: string; // "Learn about sorting"
}

export interface SortProps<T = unknown> {
  fields: SortFieldsConfig<T>;
  sorts: SortRule<T>[];
  onChange: (sorts: SortRule<T>[]) => void;
  triggerLabel?: string;
  triggerIcon?: ReactNode;
  searchPlaceholder?: string;
  // Allow drag-reorder of the active sort priority. Default true.
  reorderable?: boolean;
  size?: "xs" | "sm" | "default";
  className?: string;
  // Optional partial i18n override.
  i18n?: Partial<SortI18nConfig>;
  // Optional URL or callback for the footer "Learn about sorting" link.
  learnHref?: string;
  onLearnClick?: () => void;
}
