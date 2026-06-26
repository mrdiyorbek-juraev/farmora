"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/design-system/components/ui/popover";
import { cn } from "@repo/design-system/lib/utils";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  type LucideIcon,
  Settings2,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

// ─── Public types ────────────────────────────────────────────────────

export interface ViewOptionsGroupByOption {
  // Wire key the consumer persists in its store. Use `null` to model
  // "ungrouped" — it'll render as "None" by default.
  value: string | null;
  label: string;
  // Optional resolved icon — consumers map their per-page icon
  // registry to a Lucide component before passing through.
  icon?: ReactNode;
}

export interface ViewOptionsSortOption {
  // Wire key the consumer persists in its store.
  key: string;
  label: string;
  icon?: ReactNode;
  // Optional direction labels per field (e.g. "Newest first" / "Oldest
  // first"). Fall back to "Ascending"/"Descending" when absent.
  ascendingLabel?: string;
  descendingLabel?: string;
}

export interface ViewOptionsColumn {
  id: string;
  label: string;
  icon?: ReactNode;
  // Hidden columns render dimmed in the chip rail; click to show.
  isHidden?: boolean;
  // Locked columns can't be hidden — they render in the rail without
  // an interactive state (informational).
  isLocked?: boolean;
}

export interface ViewOptionsProps {
  // Grouping
  groupByOptions: ViewOptionsGroupByOption[];
  groupedBy: string | null;
  onGroupedByChange: (next: string | null) => void;

  // Ordering — single-field sort. The DS supports multi-priority via
  // <Sort>; for the unified Display panel one field + asc/desc keeps
  // the UI clean. Consumers that need priority chains keep <Sort>.
  sortOptions: ViewOptionsSortOption[];
  sortField: string | null;
  sortDirection: "asc" | "desc";
  onSortChange: (next: {
    field: string | null;
    direction: "asc" | "desc";
  }) => void;

  // Display properties — chip rail. Click a chip to toggle visibility.
  columns: ViewOptionsColumn[];
  onColumnsChange: (next: ViewOptionsColumn[]) => void;

  // Trigger customization. The default trigger is a size="sm" outline
  // Button with the Settings2 sliders icon — same chrome the Sort /
  // GroupBy / ViewSettings triggers used individually.
  triggerLabel?: string;
  triggerIcon?: ReactNode;
  trigger?: ReactNode;

  // Popover positioning
  align?: "start" | "center" | "end";
  className?: string;

  // i18n
  groupingLabel?: string;
  orderingLabel?: string;
  displayPropertiesLabel?: string;
  manualLabel?: string;
  noneLabel?: string;
  ascendingLabel?: string;
  descendingLabel?: string;
}

// ─── Internal dropdown row ───────────────────────────────────────────

// A label + dropdown-trigger row. The "select" UX inside the Display
// panel is a small Button with `ChevronDown` — same affordance Linear
// uses. Avoids stacking real <Select> primitives (which fight with
// the parent Popover's focus management).
function ConfigRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-foreground text-sm">{label}</span>
      <div className="flex items-center gap-1.5">{children}</div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────

export function ViewOptions({
  groupByOptions,
  groupedBy,
  onGroupedByChange,
  sortOptions,
  sortField,
  sortDirection,
  onSortChange,
  columns,
  onColumnsChange,
  triggerLabel,
  triggerIcon,
  trigger,
  align = "end",
  className,
  groupingLabel = "Grouping",
  orderingLabel = "Ordering",
  displayPropertiesLabel = "Display properties",
  manualLabel = "Manual",
  noneLabel = "None",
  ascendingLabel = "Ascending",
  descendingLabel = "Descending",
}: ViewOptionsProps) {
  const [open, setOpen] = useState(false);

  // Active group + sort selections, resolved for label display.
  const activeGroup = groupByOptions.find((o) => o.value === groupedBy);
  const activeSort = sortOptions.find((o) => o.key === sortField);
  const sortDirectionLabel = (() => {
    if (!activeSort) {
      return null;
    }
    return sortDirection === "asc"
      ? activeSort.ascendingLabel ?? ascendingLabel
      : activeSort.descendingLabel ?? descendingLabel;
  })();

  // Toggle a column's visibility. Locked columns are ignored. The
  // canonical column order is preserved across toggles.
  const toggleColumn = (id: string) => {
    onColumnsChange(
      columns.map((col) =>
        col.id === id && !col.isLocked ? { ...col, isHidden: !col.isHidden } : col
      )
    );
  };

  // Default trigger — a square sliders icon button. Consumers can
  // override with `trigger` (asChild slot) for branded chrome.
  const DefaultIcon: LucideIcon = Settings2;
  const defaultTrigger = (
    <Button
      aria-label={triggerLabel ?? "Display options"}
      className="gap-1.5"
      size="sm"
      type="button"
      variant="outline"
    >
      {triggerIcon ?? <DefaultIcon className="size-3.5" />}
      {triggerLabel ? <span>{triggerLabel}</span> : null}
    </Button>
  );

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>{trigger ?? defaultTrigger}</PopoverTrigger>
      <PopoverContent
        align={align}
        className={cn("w-[320px] p-3", className)}
      >
        <div className="flex flex-col">
          {/* Grouping selector */}
          <ConfigRow label={groupingLabel}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="gap-1.5 text-foreground"
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {activeGroup?.icon}
                  <span>{activeGroup?.label ?? noneLabel}</span>
                  <ChevronDown className="size-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuGroup>
                  {/* "None" entry — always available so users can
                      collapse grouping back to a flat list. */}
                  <DropdownMenuItem
                    onSelect={() => onGroupedByChange(null)}
                  >
                    <span className="text-muted-foreground">{noneLabel}</span>
                  </DropdownMenuItem>
                  {groupByOptions
                    .filter((option) => option.value !== null)
                    .map((option) => (
                      <DropdownMenuItem
                        key={option.value ?? "none"}
                        onSelect={() => onGroupedByChange(option.value)}
                      >
                        <span className="flex items-center gap-1.5">
                          {option.icon}
                          {option.label}
                        </span>
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </ConfigRow>

          {/* Ordering selector — field + direction toggle */}
          <ConfigRow label={orderingLabel}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="gap-1.5 text-foreground"
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {activeSort?.icon}
                  <span>{activeSort?.label ?? manualLabel}</span>
                  <ChevronDown className="size-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onSelect={() => onSortChange({ field: null, direction: "desc" })}
                  >
                    <span className="text-muted-foreground">{manualLabel}</span>
                  </DropdownMenuItem>
                  {sortOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.key}
                      onSelect={() =>
                        onSortChange({ field: option.key, direction: sortDirection })
                      }
                    >
                      <span className="flex items-center gap-1.5">
                        {option.icon}
                        {option.label}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Direction toggle — disabled while sort is Manual. */}
            <Button
              aria-label={
                sortDirection === "asc" ? ascendingLabel : descendingLabel
              }
              className="size-7"
              disabled={!activeSort}
              onClick={() =>
                onSortChange({
                  field: sortField,
                  direction: sortDirection === "asc" ? "desc" : "asc",
                })
              }
              size="icon"
              type="button"
              variant="outline"
            >
              {sortDirection === "asc" ? (
                <ArrowUp className="size-3.5" />
              ) : (
                <ArrowDown className="size-3.5" />
              )}
            </Button>
          </ConfigRow>

          {/* Display properties — chip rail */}
          <div className="mt-3 flex flex-col gap-2">
            <span className="font-medium text-foreground text-xs uppercase tracking-wide">
              {displayPropertiesLabel}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {columns.map((column) => {
                const isOn = !column.isHidden;
                const isLocked = column.isLocked;
                return (
                  <button
                    aria-pressed={isOn}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs transition-colors",
                      isOn
                        ? "border-foreground/30 bg-foreground text-background"
                        : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                      isLocked && "cursor-default opacity-60"
                    )}
                    disabled={isLocked}
                    key={column.id}
                    onClick={() => {
                      if (!isLocked) {
                        toggleColumn(column.id);
                      }
                    }}
                    type="button"
                  >
                    {column.icon}
                    <span>{column.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Suppress unused-state warning — `open` is referenced inside
// `onOpenChange` for symmetry with the rest of the composed
// popovers; this also lets future affordances (e.g. a "close on
// pick" toggle) tap into the state without an API change.
ViewOptions.displayName = "ViewOptions";
