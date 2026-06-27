"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import { ChevronDown, MoreHorizontal, Trash2, X } from "lucide-react";

import { useHerdStore } from "@/stores/herd";

import { useHerdFeatures } from "../../features";

export function HerdSelectionToolbar() {
  const count = useHerdStore((state) => state.selectedRows.length);
  const onClear = useHerdStore((state) => state.clearSelection);
  const { isRemoving, handleRemoveSelected } = useHerdFeatures();

  if (count === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg ring-1 ring-foreground/5">
        <div className="flex items-center gap-2 rounded-lg bg-muted px-2 py-1.5">
          <Badge className="h-5 min-w-5 px-1.5 tabular-nums" variant="default">
            {count}
          </Badge>
          <span className="font-medium text-muted-foreground text-sm">
            selected
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button disabled={isRemoving} size="sm" variant="ghost">
              <MoreHorizontal />
              More
              <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={handleRemoveSelected}
            >
              <Trash2 />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          aria-label="Clear selection"
          onClick={onClear}
          size="icon-sm"
          variant="ghost"
        >
          <X />
        </Button>
      </div>
    </div>
  );
}
