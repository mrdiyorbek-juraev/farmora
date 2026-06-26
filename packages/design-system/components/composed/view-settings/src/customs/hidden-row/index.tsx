"use client";

import { CommandItem } from "@repo/design-system/components/ui/command";
import type { ViewColumn } from "../../types";

interface Props {
  column: ViewColumn;
  onShow: () => void;
}

// One row on the Add Column screen. Wraps CommandItem so the parent
// Command handles keyboard navigation + filtering for free.
export function HiddenRow({ column, onShow }: Props) {
  return (
    <CommandItem
      className="h-8 gap-2 px-2"
      keywords={[column.label]}
      onSelect={onShow}
      value={column.id}
    >
      {column.icon ? (
        // Auto-size to 14px so this matches the visible-row icon size
        // — CommandItem auto-sizes child SVGs to size-4 (16px) which
        // is a hair taller than the 14px text-body label next to it.
        <span className="shrink-0 text-muted-foreground [&_svg:not([class*='size-'])]:size-3.5">
          {column.icon}
        </span>
      ) : null}
      <span className="truncate text-body">{column.label}</span>
    </CommandItem>
  );
}
