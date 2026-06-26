"use client";

import {
  SortableItem,
  SortableItemHandle,
} from "@repo/design-system/components/dice-ui/sortable";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/design-system/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import {
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  ChevronDown,
  GripVertical,
  X,
} from "lucide-react";
import { useState } from "react";
import { SortFieldPicker } from "../field-picker";
import type {
  SortFieldConfig,
  SortFieldsConfig,
  SortI18nConfig,
  SortRule,
} from "../types";

interface SortRowProps {
  // Keys already in use across all rows — passed to the field picker so
  // the user can only swap to an unused field (excluding this row's own).
  excludeKeys: Set<string>;
  fields: SortFieldsConfig;
  i18n: SortI18nConfig;
  onChange: (next: SortRule) => void;
  onRemove: () => void;
  reorderable: boolean;
  sort: SortRule;
}

function flattenFields(fields: SortFieldsConfig): SortFieldConfig[] {
  const arr = fields as Array<SortFieldConfig | { fields: SortFieldConfig[] }>;
  if (arr.length === 0) {
    return [];
  }
  if ("fields" in arr[0]) {
    return arr.flatMap((g) => (g as { fields: SortFieldConfig[] }).fields);
  }
  return arr as SortFieldConfig[];
}

// One row in the active-sort list. Internals are locked at xs density
// regardless of the consumer's trigger size — keeping every popover
// interaction tightly scaled to the IDE rhythm.
export function SortRow({
  sort,
  fields,
  excludeKeys,
  onChange,
  onRemove,
  reorderable,
  i18n,
}: SortRowProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const flat = flattenFields(fields);
  const current = flat.find((f) => f.key === sort.field);
  const ascLabel = current?.ascendingLabel ?? i18n.ascending;
  const descLabel = current?.descendingLabel ?? i18n.descending;

  // Picker excludes other rows' fields but keeps this row's own — so the
  // user always sees the currently-selected option.
  const swapExclude = new Set(excludeKeys);
  swapExclude.delete(sort.field);

  return (
    <SortableItem className="flex items-center gap-1.5" value={sort.id}>
      {reorderable ? (
        <SortableItemHandle
          aria-label="Reorder sort"
          className="text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="size-3.5" />
        </SortableItemHandle>
      ) : null}

      <Popover onOpenChange={setPickerOpen} open={pickerOpen}>
        <PopoverTrigger asChild>
          <Button
            className="min-w-0 flex-1 justify-between"
            size="xs"
            variant="outline"
          >
            <span className="flex min-w-0 items-center gap-1.5">
              {current?.icon}
              <span className="truncate">{current?.label ?? sort.field}</span>
            </span>
            <ChevronDown className="opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-fit p-0">
          <SortFieldPicker
            excludeKeys={swapExclude}
            fields={fields}
            i18n={i18n}
            onPick={(field) => {
              onChange({ ...sort, field: field.key });
              setPickerOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>

      <Select
        onValueChange={(value) =>
          onChange({ ...sort, direction: value as SortRule["direction"] })
        }
        value={sort.direction}
      >
        {/* Direction sits at a fixed width wide enough that neither label
            (Ascending / Descending) ever truncates. The field control on
            the left takes the remaining row width and is allowed to
            truncate. */}
        <SelectTrigger className="w-36 shrink-0 [&>span]:whitespace-nowrap" size="xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem className="whitespace-nowrap" value="asc">
              <ArrowUpNarrowWide />
              {ascLabel}
            </SelectItem>
            <SelectItem className="whitespace-nowrap" value="desc">
              <ArrowDownNarrowWide />
              {descLabel}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <Button
        aria-label={i18n.removeSort}
        onClick={onRemove}
        size="icon-xs"
        variant="ghost"
      >
        <X />
      </Button>
    </SortableItem>
  );
}
