"use client";

import type { Filter } from "@repo/design-system/components/composed/filters";
import type { SortRule } from "@repo/design-system/components/composed/sort";
import type { ViewColumn } from "@repo/design-system/components/composed/view-settings";
import { create } from "zustand";

const HERD_DEFAULT_COLUMNS: ViewColumn[] = [
  { id: "tag_number", label: "Tag", isLocked: true },
  { id: "name", label: "Name" },
  { id: "breed", label: "Breed" },
  { id: "gender", label: "Gender" },
  { id: "status", label: "Status" },
  { id: "date_of_birth", label: "DOB" },
  { id: "weight_kg", label: "Weight (kg)" },
  { id: "acquisition", label: "Acquisition" },
  { id: "acquired_date", label: "Acquired" },
];

type HerdStoreState = {
  filters: Filter[];
  sorts: SortRule[];
  columns: ViewColumn[];
  setFilters: (next: Filter[]) => void;
  setSorts: (next: SortRule[]) => void;
  setColumns: (next: ViewColumn[]) => void;
  reset: () => void;
};

export const useHerdStore = create<HerdStoreState>((set) => ({
  filters: [],
  sorts: [],
  columns: HERD_DEFAULT_COLUMNS,
  setFilters: (next) => set({ filters: next }),
  setSorts: (next) => set({ sorts: next }),
  setColumns: (next) => set({ columns: next }),
  reset: () =>
    set({ filters: [], sorts: [], columns: HERD_DEFAULT_COLUMNS }),
}));
