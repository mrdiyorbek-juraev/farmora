"use client";

import { Filters } from "@repo/design-system/components/composed/filters";
import { Sort } from "@repo/design-system/components/composed/sort";
import { ViewSettings } from "@repo/design-system/components/composed/view-settings";
import { Button } from "@repo/design-system/components/ui/button";
import { Plus } from "lucide-react";

import type { HerdToolbarProps } from "@/types/main/herd";

const filterFields = [
  {
    key: "status",
    label: "Status",
    type: "select" as const,
    options: [
      { value: "active", label: "Active" },
      { value: "sick", label: "Sick" },
      { value: "pregnant", label: "Pregnant" },
      { value: "sold", label: "Sold" },
      { value: "deceased", label: "Deceased" },
    ],
  },
  {
    key: "breed",
    label: "Breed",
    type: "select" as const,
    options: [
      { value: "holstein", label: "Holstein" },
      { value: "jersey", label: "Jersey" },
      { value: "angus", label: "Angus" },
      { value: "hereford", label: "Hereford" },
      { value: "brown_swiss", label: "Brown Swiss" },
      { value: "guernsey", label: "Guernsey" },
      { value: "charolais", label: "Charolais" },
      { value: "simmental", label: "Simmental" },
      { value: "other", label: "Other" },
    ],
  },
  {
    key: "gender",
    label: "Gender",
    type: "select" as const,
    options: [
      { value: "female", label: "Female" },
      { value: "male", label: "Male" },
    ],
  },
];

const sortFields = [
  { key: "created_at", label: "Date added" },
  { key: "tag_number", label: "Tag" },
  { key: "name", label: "Name" },
  { key: "date_of_birth", label: "Date of birth" },
  { key: "weight_kg", label: "Weight" },
];

export function HerdToolbar({
  filters,
  onFiltersChange,
  sorts,
  onSortsChange,
  columns,
  onColumnsChange,
  onAddNew,
}: HerdToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <Sort
          fields={sortFields}
          onChange={onSortsChange}
          size="sm"
          sorts={sorts}
        />
        <Filters
          fields={filterFields}
          filters={filters}
          onChange={onFiltersChange}
          size="sm"
        />
      </div>
      <div className="flex items-center gap-2">
        <ViewSettings columns={columns} onChange={onColumnsChange} />
        <Button onClick={onAddNew} >
          <Plus />
          Add new animal
        </Button>
      </div>
    </div>
  );
}
