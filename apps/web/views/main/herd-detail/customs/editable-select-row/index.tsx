"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import { cn } from "@repo/design-system/lib/utils";
import { ChevronsUpDown } from "lucide-react";

import type { EditableSelectRowProps } from "@/types/main/herd-detail";

export function EditableSelectRow({
  icon,
  label,
  value,
  options,
  placeholder = "Pick…",
  renderValue,
  onSave,
}: EditableSelectRowProps) {
  const handleChange = (next: string) => {
    if (next === value) {
      return;
    }
    void onSave(next);
  };

  const display = renderValue
    ? renderValue(value)
    : (options.find((option) => option.value === value)?.label ?? placeholder);

  return (
    <div className="grid grid-cols-[120px_1fr] items-center gap-3 py-1.5">
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <div className="min-w-0 text-sm">
        <DropdownMenu>
          {/* Ghost-styled trigger: looks like static text/badge until hovered. */}
          <DropdownMenuTrigger asChild>
            {/* Flat in preview — no border / bg / hover tint — so the */}
            {/* panel reads like static text. Open state (i.e. the user */}
            {/* opened the dropdown) pops the field with a real */}
            {/* input-style border. */}
            <Button
              className={cn(
                // Belt-and-braces flat: explicitly zero out border + shadow
                // so the base Button (`border border-transparent`) and
                // ghost variant don't paint a faint 1px line on dark bg.
                "h-7 w-full justify-between border-0 px-1.5 font-normal shadow-none hover:bg-transparent",
                "data-[state=open]:border data-[state=open]:border-input data-[state=open]:bg-background"
              )}
              type="button"
              variant="ghost"
            >
              <span className="min-w-0 truncate">{display}</span>
              <ChevronsUpDown className="size-3 shrink-0 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="min-w-(--radix-dropdown-menu-trigger-width)"
          >
            <DropdownMenuRadioGroup onValueChange={handleChange} value={value}>
              {options.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
