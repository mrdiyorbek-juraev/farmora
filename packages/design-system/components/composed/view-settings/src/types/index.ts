import type { ReactNode } from "react";

// One row in the visible / hidden lists. The consumer owns the
// icon (passed as JSX) so mocks stay JSX-free and icon resolution
// happens at the call site — same pattern as <Sort> and <Filters>.
export interface ViewColumn {
  icon?: ReactNode;
  id: string;
  // Hidden columns surface on the "Add column" screen and don't
  // render on the main list. Toggling `isHidden` is the only state
  // mutation the popover performs apart from reordering.
  isHidden?: boolean;
  // Locked columns are pinned by the consumer and never surface in
  // the popover. Reorder and hide both skip them so the canonical
  // `columns` array preserves their original position.
  isLocked?: boolean;
  label: string;
}

export interface ViewSettingsI18nConfig {
  // Header on the Add Column screen.
  addColumnHeading: string;
  // The "Add column" affordance below the visible list.
  addColumnLabel: string;
  // a11y for the back button on the Add Column screen.
  backLabel: string;
  emptyDescription: string;
  // Empty state when every column is already visible.
  emptyHeading: string;
  // Visible label of the "remove" item inside the row-actions menu.
  removeColumnLabel: string;
  // a11y for the drag handle on each visible row.
  reorderLabel: string;
  // a11y for the row-actions trigger on each visible row.
  rowActionsLabel: string;
  // Search input placeholder on the Add Column screen.
  searchPlaceholder: string;
  triggerLabel: string;
  // Main-screen header — kept above the visible list as a soft
  // section label.
  visibleHeading: string;
}

export interface ViewSettingsProps {
  // Popover alignment relative to the trigger. Defaults to "start".
  align?: "start" | "center" | "end";
  // Optional extra rows rendered on the main screen, immediately
  // below the "Add column" button. The consumer owns layout and
  // event wiring for whatever it renders here (e.g. a "Show
  // counters" Switch row). Hidden on the Add Column screen.
  children?: ReactNode;
  className?: string;
  // The complete column list — visible and hidden together. Ordering
  // matters: it's preserved across hide/show toggles so re-adding a
  // column drops it back at its previous position.
  columns: ViewColumn[];
  i18n?: Partial<ViewSettingsI18nConfig>;
  // Single source of truth — fires on reorder, hide, and show.
  onChange: (next: ViewColumn[]) => void;
  // Forwarded to the trigger Button. Mirrors `<Sort>` / `<Filters>`:
  // accepts the native Button sizes and defaults to `"default"` so
  // the trigger lines up with other DS buttons next to it (without
  // requiring callers to pass `size`).
  size?: "default" | "sm" | "lg" | "icon" | "xs";
  triggerIcon?: ReactNode;
  // Trigger overrides.
  triggerLabel?: string;
  variant?: "solid" | "outline";
}
