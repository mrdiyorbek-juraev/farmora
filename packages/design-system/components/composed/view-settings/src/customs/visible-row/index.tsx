"use client";

import {
  SortableItem,
  SortableItemHandle,
} from "@repo/design-system/components/composed/sortable";
import { Button } from "@repo/design-system/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import { EllipsisVertical, EyeOff, GripVertical } from "lucide-react";
import type { ViewColumn } from "../../types";

interface Props {
  column: ViewColumn;
  onHide: () => void;
  removeColumnLabel: string;
  reorderLabel: string;
  rowActionsLabel: string;
}

// One row on the main screen: drag handle on the left, icon + label
// in the middle, row-actions ellipsis on the right. The ellipsis is
// a DropdownMenu so we can add per-column actions later (pin, copy
// id, rename, …) without re-architecting the row.
//
// Locked columns never reach this component — the popover filters
// them out upstream.
export function VisibleRow({
  column,
  onHide,
  removeColumnLabel,
  reorderLabel,
  rowActionsLabel,
}: Props) {
  return (
    <SortableItem asChild value={column.id}>
      <div className="group flex h-8 items-center gap-1 rounded-md px-1 hover:bg-accent/50">
        <SortableItemHandle asChild>
          <Button
            aria-label={reorderLabel}
            className="cursor-grab text-muted-foreground/60 hover:text-foreground active:cursor-grabbing"
            size="icon-xs"
            variant="ghost"
          >
            <GripVertical />
          </Button>
        </SortableItemHandle>

        <span className="flex min-w-0 flex-1 items-center gap-2">
          {column.icon ? (
            // Auto-size child SVG so icons match the 14px text height
            // — mirrors the canonical Button / DropdownMenuItem child
            // SVG selector. Plain <span> wrappers don't inherit that.
            <span className="shrink-0 text-muted-foreground [&_svg:not([class*='size-'])]:size-3.5">
              {column.icon}
            </span>
          ) : null}
          <span className="truncate text-body">{column.label}</span>
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label={`${rowActionsLabel}: ${column.label}`}
              className="text-muted-foreground/60 hover:text-foreground data-[state=open]:bg-accent data-[state=open]:text-foreground"
              size="icon-xs"
              variant="ghost"
            >
              <EllipsisVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44" sideOffset={4}>
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={onHide}>
                <EyeOff />
                {removeColumnLabel}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </SortableItem>
  );
}
