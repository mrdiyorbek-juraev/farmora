"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Calendar } from "@repo/design-system/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/design-system/components/ui/popover";
import { cn } from "@repo/design-system/lib/utils";
import { format, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";

export const DATE_WIRE_FORMAT = "yyyy-MM-dd";

export function parseDateValue(value: string | undefined): Date | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = parse(value, DATE_WIRE_FORMAT, new Date());
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

interface DatePickerProps {
  disableFuture?: boolean;
  id: string;
  invalid?: boolean;
  onChange: (next: string) => void;
  placeholder?: string;
  value: string;
}

// Pure date control: a popover-anchored calendar that emits the wire-format
// (`yyyy-MM-dd`) string. Formik binding lives in `DateField`.
export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Pick a date",
  invalid,
  disableFuture,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const date = parseDateValue(value);

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-invalid={invalid}
          className={cn(
            "justify-start gap-2 px-3 font-normal",
            !date && "text-muted-foreground"
          )}
          id={id}
          style={{ width: "100%" }}
          type="button"
          variant="outline"
        >
          <CalendarIcon className="text-muted-foreground" />
          {date ? format(date, "PPP") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          captionLayout="dropdown"
          disabled={disableFuture ? { after: new Date() } : undefined}
          mode="single"
          onSelect={(next) => {
            if (next) {
              onChange(format(next, DATE_WIRE_FORMAT));
              setOpen(false);
            }
          }}
          selected={date}
        />
      </PopoverContent>
    </Popover>
  );
}
