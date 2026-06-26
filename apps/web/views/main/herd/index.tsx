"use client";

import { useConfirm } from "@repo/design-system/components/composed/confirm-dialog";
import type { Filter } from "@repo/design-system/components/composed/filters";
import type { SortRule } from "@repo/design-system/components/composed/sort";
import { useCallback, useMemo, useState } from "react";

import type {
  Breed,
  CattleRow,
  CattleSortColumn,
  Gender,
  ListCattleFilters,
  SortDirection,
  Status,
} from "@/models/cattle";
import { useCattleMutations } from "@/services/cattle/mutations";
import { useHerdStore } from "@/stores/herd";
import { useGlobalModal } from "@/stores/shared/modal-store";

import { HerdSelectionToolbar } from "./customs/herd-selection-toolbar";
import { HerdTable } from "./customs/herd-table";
import { HerdToolbar } from "./customs/herd-toolbar";
import { AnimalFormModal } from "./modals/create-animal-modal";

const SORTABLE_COLUMNS: ReadonlySet<CattleSortColumn> = new Set([
  "created_at",
  "tag_number",
  "name",
  "date_of_birth",
  "weight_kg",
  "status",
  "breed",
]);

function pickFirstValue<T extends string>(
  rule: Filter | undefined
): T | undefined {
  const value = rule?.values?.[0]?.value;
  return typeof value === "string" ? (value as T) : undefined;
}

// Convert the composed-Filters chip list + Sort rules into the flat
// shape listCattleAction understands. Each filter field is single-
// valued, and the BE applies one ORDER BY (with a created_at
// tiebreaker) so we honour the first SortRule only.
function mapToListInput(
  rules: Filter[],
  sorts: SortRule[]
): Omit<ListCattleFilters, "limit" | "offset"> {
  const byField = new Map(rules.map((rule) => [rule.field, rule]));
  const primarySort = sorts[0];
  const sortField =
    primarySort && SORTABLE_COLUMNS.has(primarySort.field as CattleSortColumn)
      ? (primarySort.field as CattleSortColumn)
      : undefined;

  return {
    status: pickFirstValue<Status>(byField.get("status")),
    breed: pickFirstValue<Breed>(byField.get("breed")),
    gender: pickFirstValue<Gender>(byField.get("gender")),
    sort: sortField,
    direction: sortField
      ? (primarySort.direction as SortDirection)
      : undefined,
  };
}

export function HerdView() {
  const filters = useHerdStore((state) => state.filters);
  const sorts = useHerdStore((state) => state.sorts);
  const columns = useHerdStore((state) => state.columns);
  const setFilters = useHerdStore((state) => state.setFilters);
  const setSorts = useHerdStore((state) => state.setSorts);
  const setColumns = useHerdStore((state) => state.setColumns);
  const setModal = useGlobalModal((state) => state.setModal);
  const { onDeleteMany } = useCattleMutations();
  const confirm = useConfirm();

  const [selectedRows, setSelectedRows] = useState<CattleRow[]>([]);
  // Bumped each time we want AG Grid to drop its current selection
  // (after a successful bulk remove, or when the user clicks X).
  const [clearSignal, setClearSignal] = useState(0);

  const listInput = useMemo(
    () => mapToListInput(filters, sorts),
    [filters, sorts]
  );

  const handleAddNew = () => {
    setModal({ animalForm: { open: true, props: null } });
  };

  const handleClearSelection = useCallback(() => {
    setSelectedRows([]);
    setClearSignal((n) => n + 1);
  }, []);

  const handleRemoveSelected = useCallback(async () => {
    if (selectedRows.length === 0) {
      return;
    }
    const count = selectedRows.length;
    const ids = selectedRows.map((row) => row.id);

    const result = await confirm({
      title: `Remove ${count} animal${count === 1 ? "" : "s"}?`,
      description:
        count === 1
          ? "This permanently deletes the selected animal and its status history. This cannot be undone."
          : `This permanently deletes ${count} animals and their status history. This cannot be undone.`,
      confirmText: "Remove",
      cancelText: "Cancel",
      loadingText: "Removing...",
      confirmButton: { variant: "destructive" },
    });
    if (!result.confirmed) {
      return;
    }

    confirm.setLoading(true);
    try {
      await onDeleteMany.mutateAsync({ ids });
      handleClearSelection();
    } catch {
      return;
    } finally {
      confirm.setLoading(false);
    }
    result.close();
  }, [confirm, handleClearSelection, onDeleteMany, selectedRows]);

  return (
    <div className="flex flex-1 flex-col">
      <HerdToolbar
        columns={columns}
        filters={filters}
        onAddNew={handleAddNew}
        onColumnsChange={setColumns}
        onFiltersChange={setFilters}
        onSortsChange={setSorts}
        sorts={sorts}
      />
      <div className="flex-1 p-4">
        <HerdTable
          clearSelectionSignal={clearSignal}
          columns={columns}
          filters={listInput}
          onAddNew={handleAddNew}
          onSelectionChange={setSelectedRows}
        />
      </div>
      <HerdSelectionToolbar
        count={selectedRows.length}
        disabled={onDeleteMany.isPending}
        onClear={handleClearSelection}
        onRemove={handleRemoveSelected}
      />
      <AnimalFormModal />
    </div>
  );
}
