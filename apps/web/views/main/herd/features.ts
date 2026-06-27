"use client";

import { useConfirm } from "@repo/design-system/components/composed/confirm-dialog";
import type { Filter } from "@repo/design-system/components/composed/filters";
import type { SortRule } from "@repo/design-system/components/composed/sort";
import { useCallback } from "react";

import type {
  Breed,
  CattleSortColumn,
  Gender,
  ListCattleFilters,
  SortDirection,
  Status,
} from "@/models/cattle";
import { useCattleMutations } from "@/services/cattle/mutations";
import { useHerdStore } from "@/stores/herd";
import { useGlobalModal } from "@/stores/shared/modal-store";

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

/**
 * Map the toolbar's filter + sort rules into the server list input.
 * Pure helper — components call it with the store values they already
 * read, so the derivation lives next to the actions but stays cheap.
 */
export function mapToListInput(
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
    direction: sortField ? (primarySort.direction as SortDirection) : undefined,
  };
}

/**
 * Action logic for the herd list view. Only owns the React hooks that
 * can't live in a store (the bulk-delete mutation + the confirm dialog)
 * and the handlers that compose them. Store slices are NOT subscribed
 * here — the handlers read selection imperatively via `getState()` at
 * call-time, and components read whatever store state they render.
 */
export function useHerdFeatures() {
  const { onDeleteMany } = useCattleMutations();
  const confirm = useConfirm();

  const handleAddNew = useCallback(() => {
    useGlobalModal
      .getState()
      .setModal({ animalForm: { open: true, props: null } });
  }, []);

  const handleRemoveSelected = useCallback(async () => {
    const { selectedRows, clearSelection } = useHerdStore.getState();
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
      clearSelection();
    } catch {
      return;
    } finally {
      confirm.setLoading(false);
    }
    result.close();
  }, [confirm, onDeleteMany]);

  return {
    isRemoving: onDeleteMany.isPending,
    handleAddNew,
    handleRemoveSelected,
  };
}
