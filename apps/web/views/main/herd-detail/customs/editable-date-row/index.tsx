"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Calendar } from "@repo/design-system/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/design-system/components/ui/popover";
import { cn } from "@repo/design-system/lib/utils";
import { format, isValid, parse } from "date-fns";
import { useState } from "react";

import type { EditableDateRowProps } from "@/types/main/herd-detail";

const DATE_WIRE_FORMAT = "yyyy-MM-dd";

function parseDateValue(value: string | null | undefined): Date | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = parse(value, DATE_WIRE_FORMAT, new Date());
  return isValid(parsed) ? parsed : undefined;
}

export function EditableDateRow({
  icon,
  label,
  value,
  placeholder = "Pick a date",
  disableFuture,
  onSave,
}: EditableDateRowProps) {
  const [open, setOpen] = useState(false);
  const date = parseDateValue(value);

  const handleSelect = (next: Date | undefined) => {
    if (!next) {
      return;
    }
    const formatted = format(next, DATE_WIRE_FORMAT);
    setOpen(false);
    if (formatted === value) {
      return;
    }
    void onSave(formatted);
  };

  return (
    <div className="grid grid-cols-[120px_1fr] items-center gap-3 py-1.5">
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <div className="min-w-0 text-sm">
        <Popover onOpenChange={setOpen} open={open}>
          <PopoverTrigger asChild>
            {/* Flat in preview — no border / bg / hover tint — so the */}
            {/* panel reads like static text. Open state (calendar popover */}
            {/* is open) pops the field with a real input-style border. */}
            <Button
              className={cn(
                // Belt-and-braces flat: zero out border + shadow so the
                // base Button and ghost variant don't paint a faint
                // 1px line on dark backgrounds.
                "h-7 w-full justify-start border-0 px-1.5 font-normal shadow-none hover:bg-transparent",
                "data-[state=open]:border data-[state=open]:border-input data-[state=open]:bg-background",
                !date && "text-muted-foreground"
              )}
              type="button"
              variant="ghost"
            >
              <span className="truncate tabular-nums">
                {date ? format(date, "MMM d, yyyy") : placeholder}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              captionLayout="dropdown"
              disabled={disableFuture ? { after: new Date() } : undefined}
              mode="single"
              onSelect={handleSelect}
              selected={date}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
