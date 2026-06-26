"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/design-system/components/ui/popover";
import {
  Sortable,
  SortableContent,
} from "@repo/design-system/components/dice-ui/sortable";
import { cn } from "@repo/design-system/lib/utils";
import { ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { SortFieldPicker } from "./field-picker";
import { SortFooter } from "./sort-footer";
import { SortRow } from "./sort-row";
import type {
  SortFieldConfig,
  SortI18nConfig,
  SortProps,
  SortRule,
} from "./types";

const DEFAULT_I18N: SortI18nConfig = {
  triggerEmpty: "Sort",
  triggerSortedBy: "Sorted by",
  searchPlaceholder: "Search attributes…",
  noFieldsFound: "No attributes found.",
  addSort: "Add sort",
  ascending: "Ascending",
  descending: "Descending",
  removeSort: "Remove sort",
  learnAboutSorting: "Learn about sorting",
};

// Stable id generator that doesn't depend on Date.now (which can collide
// in fast-fire scenarios) — small random suffix is enough for client ids.
let nextId = 0;
const makeSortId = () =>
  `sort-${++nextId}-${Math.random().toString(36).slice(2, 8)}`;

function flattenFields(fields: SortProps["fields"]): SortFieldConfig[] {
  const arr = fields as Array<SortFieldConfig | { fields: SortFieldConfig[] }>;
  if (arr.length === 0) {
    return [];
  }
  if ("fields" in arr[0]) {
    return arr.flatMap((g) => (g as { fields: SortFieldConfig[] }).fields);
  }
  return arr as SortFieldConfig[];
}

// Customizable sort builder, mirroring <Filters>:
//   - Trigger pill summarises active sorts: "Sort" | "Sorted by Field +N".
//   - Popover branches: empty → field picker; populated → row list +
//     "Add sort" + footer.
//   - Each row: drag handle (priority), field combobox, direction Select,
//     remove X.
//   - Built on @repo/design-system primitives so a11y/keyboard come free.
export function Sort<T = unknown>({
  fields,
  sorts,
  onChange,
  triggerLabel,
  triggerIcon,
  searchPlaceholder,
  reorderable = true,
  size = "default",
  className,
  i18n: i18nOverride,
  learnHref,
  onLearnClick,
}: SortProps<T>) {
  const i18n = useMemo<SortI18nConfig>(
    () => ({
      ...DEFAULT_I18N,
      ...(searchPlaceholder ? { searchPlaceholder } : {}),
      ...i18nOverride,
    }),
    [i18nOverride, searchPlaceholder]
  );

  const [open, setOpen] = useState(false);

  const flat = useMemo(
    () => flattenFields(fields as SortProps["fields"]),
    [fields]
  );
  const usedKeys = useMemo(() => new Set(sorts.map((s) => s.field)), [sorts]);
  const allUsed = sorts.length >= flat.length && flat.length > 0;

  const handlePick = (field: SortFieldConfig) => {
    const next: SortRule<T> = {
      id: makeSortId(),
      field: field.key,
      direction: "asc",
    };
    onChange([...(sorts as SortRule<T>[]), next]);
  };

  const handleRowChange = (index: number, next: SortRule<T>) => {
    const out = [...(sorts as SortRule<T>[])];
    out[index] = next;
    onChange(out);
  };

  const handleRowRemove = (index: number) => {
    onChange((sorts as SortRule<T>[]).filter((_, i) => i !== index));
  };

  // Trigger summary text per spec.
  const firstSortField = sorts[0]
    ? flat.find((f) => f.key === sorts[0].field)
    : null;
  const extraCount = sorts.length - 1;

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          className={cn(className)}
          size={size}
          type="button"
          variant="outline"
        >
          {triggerIcon ?? <ArrowUpDown />}
          {sorts.length === 0 ? (
            <span>{triggerLabel ?? i18n.triggerEmpty}</span>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="text-muted-foreground">
                {i18n.triggerSortedBy}
              </span>
              <span className="font-medium">
                {firstSortField?.label ?? sorts[0].field}
              </span>
              {extraCount > 0 ? (
                <Badge className="ml-0.5" variant="secondary">
                  +{extraCount}
                </Badge>
              ) : null}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      {/* Width is driven by the inner content so the empty-state picker
          (w-64) and the populated sort list (w-md) each get the right
          footprint without the wrapper imposing a single value. */}
      <PopoverContent align="end" className="w-fit p-0">
        {sorts.length === 0 ? (
          <SortFieldPicker
            excludeKeys={usedKeys}
            fields={fields as SortProps["fields"]}
            i18n={i18n}
            onPick={handlePick}
          />
        ) : (
          <div className="flex w-md flex-col">
            <Sortable<SortRule<T>>
              getItemValue={(item) => item.id}
              onValueChange={(next) => onChange(next)}
              orientation="vertical"
              value={sorts as SortRule<T>[]}
            >
              <SortableContent className="flex flex-col gap-1.5 p-2">
                {(sorts as SortRule<T>[]).map((s, i) => (
                  <SortRow
                    excludeKeys={usedKeys}
                    fields={fields as SortProps["fields"]}
                    i18n={i18n}
                    key={s.id}
                    onChange={(next) => handleRowChange(i, next as SortRule<T>)}
                    onRemove={() => handleRowRemove(i)}
                    reorderable={reorderable}
                    sort={s as SortRule}
                  />
                ))}
              </SortableContent>
            </Sortable>

            <SortFooter
              allUsed={allUsed}
              excludeKeys={usedKeys}
              fields={fields as SortProps["fields"]}
              i18n={i18n}
              learnHref={learnHref}
              onLearnClick={onLearnClick}
              onPick={handlePick}
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
