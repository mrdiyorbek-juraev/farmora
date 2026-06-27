"use client";

import type { Filter } from "@repo/design-system/components/composed/filters";
import type { SortRule } from "@repo/design-system/components/composed/sort";
import type { ViewColumn } from "@repo/design-system/components/composed/view-settings";
import { create } from "zustand";

import type { CattleRow } from "@/models/cattle";

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

interface HerdStoreState {
  clearSelection: () => void;
  // Bumped to tell the data grid to drop its current selection — after a
  // successful bulk remove, or when the user clears manually.
  clearSignal: number;
  columns: ViewColumn[];
  filters: Filter[];
  reset: () => void;
  // Selection lives here (not in the view) so the toolbar, table, and
  // the useHerdFeatures actions all read/write it without prop drilling.
  selectedRows: CattleRow[];
  setColumns: (next: ViewColumn[]) => void;
  setFilters: (next: Filter[]) => void;
  setSelectedRows: (next: CattleRow[]) => void;
  setSorts: (next: SortRule[]) => void;
  sorts: SortRule[];
}

export const useHerdStore = create<HerdStoreState>((set) => ({
  filters: [],
  sorts: [],
  columns: HERD_DEFAULT_COLUMNS,
  selectedRows: [],
  clearSignal: 0,
  setFilters: (next) => set({ filters: next }),
  setSorts: (next) => set({ sorts: next }),
  setColumns: (next) => set({ columns: next }),
  setSelectedRows: (next) => set({ selectedRows: next }),
  clearSelection: () =>
    set((state) => ({ selectedRows: [], clearSignal: state.clearSignal + 1 })),
  reset: () =>
    set((state) => ({
      filters: [],
      sorts: [],
      columns: HERD_DEFAULT_COLUMNS,
      selectedRows: [],
      clearSignal: state.clearSignal + 1,
    })),
}));
