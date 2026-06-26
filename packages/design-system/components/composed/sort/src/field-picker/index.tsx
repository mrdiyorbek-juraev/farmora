"use client";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/design-system/components/ui/command";
import type {
  SortFieldConfig,
  SortFieldGroup,
  SortFieldsConfig,
  SortI18nConfig,
} from "../types";

interface SortFieldPickerProps {
  fields: SortFieldsConfig;
  // Set of field keys that are already used — hidden from the picker so
  // the consumer can only pick each field once.
  excludeKeys?: Set<string>;
  onPick: (field: SortFieldConfig) => void;
  i18n: Pick<SortI18nConfig, "searchPlaceholder" | "noFieldsFound">;
  className?: string;
}

const isFieldGroup = (
  item: SortFieldConfig | SortFieldGroup
): item is SortFieldGroup =>
  "fields" in item && Array.isArray((item as SortFieldGroup).fields);

// Normalize either a flat or grouped config into an array of
// (groupLabel, fields) tuples so the render path is one shape.
function normalizeGroups(
  fields: SortFieldsConfig
): { group?: string; fields: SortFieldConfig[] }[] {
  const arr = fields as Array<SortFieldConfig | SortFieldGroup>;
  if (arr.length === 0) {
    return [];
  }
  if (isFieldGroup(arr[0])) {
    return arr as SortFieldGroup[];
  }
  return [{ fields: arr as SortFieldConfig[] }];
}

// Searchable Command list that fronts the field catalog. Single component
// used in three places: empty-state, "+ Add sort" overlay, and per-row
// field swap. Width is owned here (default `w-64`) so callers don't have
// to reapply it — pass `className` only when overriding.
export function SortFieldPicker({
  fields,
  excludeKeys,
  onPick,
  i18n,
  className,
}: SortFieldPickerProps) {
  const groups = normalizeGroups(fields);

  return (
    <Command className={className ?? "w-64"}>
      <CommandInput placeholder={i18n.searchPlaceholder} />
      <CommandList>
        <CommandEmpty>{i18n.noFieldsFound}</CommandEmpty>
        {groups.map((group, index) => {
          const visible = group.fields.filter(
            (f) => !excludeKeys?.has(f.key)
          );
          if (visible.length === 0) {
            return null;
          }
          return (
            <CommandGroup heading={group.group} key={group.group ?? index}>
              {visible.map((field) => (
                <CommandItem
                  key={field.key}
                  onSelect={() => onPick(field)}
                  value={field.label}
                >
                  {field.icon}
                  <span className="truncate">{field.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
      </CommandList>
    </Command>
  );
}
