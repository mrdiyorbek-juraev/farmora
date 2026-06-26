"use client";

import {
  Sortable,
  SortableContent,
} from "@repo/design-system/components/dice-ui/sortable";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from "@repo/design-system/components/ui/command";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/design-system/components/ui/empty";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/design-system/components/ui/popover";
import { Separator } from "@repo/design-system/components/ui/separator";
import { cn } from "@repo/design-system/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  SearchX,
  SlidersHorizontal,
} from "lucide-react";
import { useMemo, useState } from "react";
import { HiddenRow } from "./customs/hidden-row";
import { VisibleRow } from "./customs/visible-row";
import type {
  ViewColumn,
  ViewSettingsI18nConfig,
  ViewSettingsProps,
} from "./types";

const DEFAULT_I18N: ViewSettingsI18nConfig = {
  addColumnHeading: "Add column",
  addColumnLabel: "Add column",
  backLabel: "Back",
  emptyDescription: "All available columns are already in view.",
  emptyHeading: "Nothing to add",
  removeColumnLabel: "Remove column",
  reorderLabel: "Drag to reorder",
  rowActionsLabel: "Column actions",
  searchPlaceholder: "Search attributes…",
  triggerLabel: "View settings",
  visibleHeading: "View settings",
};

type Screen = "main" | "add";

// Reorder the *visible, unlocked* subset while leaving hidden and
// locked columns in their original positions. Both inputs and the
// output use the canonical ordered `columns` list — we only shuffle
// the slots that are eligible for drag-reorder.
function reorderVisible(
  columns: ViewColumn[],
  nextVisible: ViewColumn[]
): ViewColumn[] {
  let visibleIndex = 0;
  return columns.map((c) => {
    if (c.isHidden || c.isLocked) {
      return c;
    }
    const reordered = nextVisible[visibleIndex];
    visibleIndex += 1;
    return reordered ?? c;
  });
}

// Generic column-manager popover. Two screens:
//   • main: drag-reorderable list of visible columns + "Add column"
//   • add:  Command-driven search over hidden columns + optional
//           "Create new attribute" footer
//
// State is fully controlled — the caller passes `columns` and gets
// `onChange(next)` for reorder, hide, and show. Locked columns are
// pinned (no drag handle, no X).
export function ViewSettings({
  align = "start",
  children,
  className,
  columns,
  i18n: i18nOverride,
  onChange,
  size = "default",
  triggerIcon,
  triggerLabel,
  variant = "outline",
}: ViewSettingsProps) {
  const [open, setOpen] = useState(false);
  const [screen, setScreen] = useState<Screen>("main");

  const i18n = useMemo<ViewSettingsI18nConfig>(
    () => ({ ...DEFAULT_I18N, ...i18nOverride }),
    [i18nOverride]
  );

  // Locked columns are pinned by the consumer and never surface in
  // the popover — they're an internal "always present" marker, not a
  // UI affordance. Single iteration over `columns` partitions the
  // remaining rows into visible / hidden buckets.
  const { visibleColumns, hiddenColumns } = useMemo(() => {
    const visible: ViewColumn[] = [];
    const hidden: ViewColumn[] = [];
    for (const column of columns) {
      if (column.isLocked) {
        continue;
      }
      if (column.isHidden) {
        hidden.push(column);
      } else {
        visible.push(column);
      }
    }
    return { hiddenColumns: hidden, visibleColumns: visible };
  }, [columns]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setScreen("main");
    }
  };

  const handleReorder = (nextVisible: ViewColumn[]) => {
    onChange(reorderVisible(columns, nextVisible));
  };

  const handleHide = (id: string) => {
    onChange(columns.map((c) => (c.id === id ? { ...c, isHidden: true } : c)));
  };

  const handleShow = (id: string) => {
    onChange(columns.map((c) => (c.id === id ? { ...c, isHidden: false } : c)));
    setScreen("main");
  };

  const buttonVariant = variant === "solid" ? "secondary" : "outline";

  return (
    <Popover onOpenChange={handleOpenChange} open={open}>
      <PopoverTrigger asChild>
        <Button
          className={cn("gap-1.5", className)}
          size={size}
          variant={buttonVariant}
        >
          {triggerIcon ?? <SlidersHorizontal className="size-3.5" />}
          <span>{triggerLabel ?? i18n.triggerLabel}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align={align}
        className="w-72 p-0"
        onOpenAutoFocus={(e) => {
          // Don't yank focus into the first row — leaves the
          // popover quiet until the user explicitly tabs into it.
          if (screen === "main") {
            e.preventDefault();
          }
        }}
        sideOffset={4}
      >
        {screen === "main" ? (
          <div className="flex flex-col">
            <div className="px-2 pt-2">
              <span className="text-caption text-muted-foreground">
                {i18n.visibleHeading}
              </span>
            </div>

            <div className="flex flex-col gap-0.5 p-1">
              <Sortable
                getItemValue={(c) => c.id}
                onValueChange={handleReorder}
                value={visibleColumns}
              >
                <SortableContent asChild>
                  <div className="flex flex-col gap-0.5">
                    {visibleColumns.map((column) => (
                      <VisibleRow
                        column={column}
                        key={column.id}
                        onHide={() => handleHide(column.id)}
                        removeColumnLabel={i18n.removeColumnLabel}
                        reorderLabel={i18n.reorderLabel}
                        rowActionsLabel={i18n.rowActionsLabel}
                      />
                    ))}
                  </div>
                </SortableContent>
              </Sortable>

              <div className="-mx-1 my-1 h-px bg-border" />

              <Button
                className="h-8 w-full justify-between gap-2 px-1 font-normal"
                onClick={() => setScreen("add")}
                size="sm"
                variant="ghost"
              >
                <span className="flex items-center gap-2">
                  <Plus className="size-3.5 text-muted-foreground" />
                  <span>{i18n.addColumnLabel}</span>
                </span>
                <ChevronRight className="size-3.5 text-muted-foreground" />
              </Button>

              {children}
            </div>
          </div>
        ) : (
          <Command>
            <div className="flex items-center gap-1 px-1 py-1">
              <Button
                aria-label={i18n.backLabel}
                className="size-6"
                onClick={() => setScreen("main")}
                size="icon"
                variant="ghost"
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <span className="text-caption text-muted-foreground">
                {i18n.addColumnHeading}
              </span>
            </div>
            <Separator />
            <CommandInput
              autoFocus
              className="h-9"
              placeholder={i18n.searchPlaceholder}
            />
            <CommandList className="max-h-72">
              <CommandEmpty asChild>
                <Empty className="py-6">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <SearchX />
                    </EmptyMedia>
                    <EmptyTitle className="text-body">
                      {i18n.emptyHeading}
                    </EmptyTitle>
                    <EmptyDescription className="text-caption">
                      {i18n.emptyDescription}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </CommandEmpty>

              {hiddenColumns.length > 0 ? (
                <CommandGroup>
                  {hiddenColumns.map((column) => (
                    <HiddenRow
                      column={column}
                      key={column.id}
                      onShow={() => handleShow(column.id)}
                    />
                  ))}
                </CommandGroup>
              ) : null}
            </CommandList>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  );
}
