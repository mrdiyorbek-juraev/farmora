import type { Filter } from "@repo/design-system/components/composed/filters";
import type { SortRule } from "@repo/design-system/components/composed/sort";
import type { ViewColumn } from "@repo/design-system/components/composed/view-settings";

import type { CattleRow, ListCattleFilters } from "@/models/cattle";

export interface HerdSelectionToolbarProps {
  count: number;
  onRemove: () => void;
  onClear: () => void;
  disabled?: boolean;
}

export interface HerdToolbarProps {
  filters: Filter[];
  onFiltersChange: (next: Filter[]) => void;
  sorts: SortRule[];
  onSortsChange: (next: SortRule[]) => void;
  columns: ViewColumn[];
  onColumnsChange: (next: ViewColumn[]) => void;
  onAddNew: () => void;
}

export interface HerdTableProps {
  filters?: Omit<ListCattleFilters, "limit" | "offset">;
  columns: ViewColumn[];
  onSelectionChange?: (rows: CattleRow[]) => void;
  clearSelectionSignal?: number;
  /** Called when the user clicks the "+" affordance on the Tag column. */
  onAddNew?: () => void;
}
