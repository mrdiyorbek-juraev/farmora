"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Plus } from "lucide-react";

import { type DashboardDateRange, DateRangePicker } from "../date-range-picker";

export type DashboardToolbarProps = {
  range: DashboardDateRange;
  onRangeChange: (next: DashboardDateRange) => void;
  onAddNew: () => void;
};

export function DashboardToolbar({
  range,
  onRangeChange,
  onAddNew,
}: DashboardToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2">
      <DateRangePicker onChange={onRangeChange} value={range} />
      <Button onClick={onAddNew} size="sm">
        <Plus className="size-4" />
        Add new animal
      </Button>
    </div>
  );
}