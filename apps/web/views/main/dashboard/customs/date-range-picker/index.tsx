"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Calendar } from "@repo/design-system/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/design-system/components/ui/popover";
import { Separator } from "@repo/design-system/components/ui/separator";
import { cn } from "@repo/design-system/lib/utils";
import { format, subDays, subMonths, subYears } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";

export type DashboardDateRange = {
  from: Date;
  to: Date;
};

export type DateRangePickerProps = {
  value: DashboardDateRange;
  onChange: (next: DashboardDateRange) => void;
};

type Preset = {
  label: string;
  build: () => DashboardDateRange;
};

const presets: Preset[] = [
  {
    label: "Last 7 days",
    build: () => ({ from: subDays(new Date(), 6), to: new Date() }),
  },
  {
    label: "Last 30 days",
    build: () => ({ from: subDays(new Date(), 29), to: new Date() }),
  },
  {
    label: "Last 90 days",
    build: () => ({ from: subDays(new Date(), 89), to: new Date() }),
  },
  {
    label: "Last 6 months",
    build: () => ({ from: subMonths(new Date(), 6), to: new Date() }),
  },
  {
    label: "Last year",
    build: () => ({ from: subYears(new Date(), 1), to: new Date() }),
  },
];

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>(value);

  const label =
    value.from.getTime() === value.to.getTime()
      ? format(value.from, "MMM d, yyyy")
      : `${format(value.from, "MMM d, yyyy")} – ${format(value.to, "MMM d, yyyy")}`;

  const commit = (next: DashboardDateRange) => {
    onChange(next);
    setDraft({ from: next.from, to: next.to });
    setOpen(false);
  };

  return (
    <Popover
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          // Re-seed the in-popover draft from the committed value
          // each time the popover opens so an aborted edit can't
          // persist as the visible selection.
          setDraft({ from: value.from, to: value.to });
        }
      }}
      open={open}
    >
      <PopoverTrigger asChild>
        <Button
          className={cn("h-8 justify-start gap-2 rounded-full font-normal")}
          size="sm"
          variant="outline"
        >
          <CalendarIcon className="size-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="flex w-auto flex-col gap-0 p-0"
      >
        <div className="p-2">
          <Calendar
            defaultMonth={draft?.from ?? value.from}
            mode="range"
            numberOfMonths={2}
            onSelect={setDraft}
            selected={draft}
          />
        </div>
        <Separator />
        <div className="flex flex-wrap items-center gap-1 px-2 py-2">
          {presets.map((preset) => (
            <Button
              key={preset.label}
              onClick={() => commit(preset.build())}
              size="sm"
              variant="ghost"
            >
              {preset.label}
            </Button>
          ))}
        </div>
        <Separator />
        <div className="flex items-center justify-end gap-2 p-2">
          <Button
            onClick={() => {
              setDraft({ from: value.from, to: value.to });
              setOpen(false);
            }}
            size="sm"
            variant="ghost"
          >
            Cancel
          </Button>
          <Button
            disabled={!(draft?.from && draft?.to)}
            onClick={() => {
              if (draft?.from && draft?.to) {
                commit({ from: draft.from, to: draft.to });
              }
            }}
            size="sm"
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}