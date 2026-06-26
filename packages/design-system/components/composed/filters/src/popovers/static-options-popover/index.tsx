"use client";

import { Checkbox } from "@repo/design-system/components/ui/checkbox";
import {
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@repo/design-system/components/ui/command";
import { Kbd } from "@repo/design-system/components/ui/kbd";
import { useState } from "react";
import { useFilterContext } from "../../context";
import { useAltKeyLabel } from "../../lib/platform";
import type { FilterFieldConfig, FilterOption } from "../../types";

// Indexes 1-9 are bound at the picker level via `Alt + N` — pressing
// Alt + 5 picks the option at static position 5 (NOT the
// displayed-order, which moves selected to the top). The badge tracks
// the static index so what the user sees matches what the key
// invokes. We keep the modifier requirement so plain digits keep
// flowing into the search input.
const MAX_OPTION_SHORTCUTS = 9;

// Uses the DS Checkbox so the popover stays consistent with the rest
// of the platform. The checkbox is non-interactive — the CommandItem's
// onSelect handles selection, so we don't wire onChange here;
// pointer-events-none keeps clicks bubbling up to the row.
function MultiCheckbox({ checked }: { checked: boolean }) {
  return (
    <Checkbox
      aria-hidden
      checked={checked}
      className="pointer-events-none size-3.5 shrink-0"
      tabIndex={-1}
    />
  );
}

interface StaticOptionsPopoverProps<T = unknown> {
  field: FilterFieldConfig<T>;
  onChange: (values: FilterOption<T>[]) => void;
  onClose?: () => void;
  values: FilterOption<T>[];
}

// Renders the options list for a `select` / `multiselect` field whose
// `options` are statically declared on the field config. Designed to be used
// INLINE inside an outer <Command> wrapper (e.g. the Add Filter overlay),
// so it returns Command children directly — no nested <Command>, no padding
// duplication.
export function StaticOptionsPopover<T = unknown>({
  field,
  values,
  onChange,
  onClose,
}: StaticOptionsPopoverProps<T>) {
  const [searchInput, setSearchInput] = useState("");
  const context = useFilterContext();
  const altLabel = useAltKeyLabel();

  const isMultiSelect = field.type === "multiselect" || values.length > 1;
  const effectiveValues: FilterOption<T>[] =
    (field.value === undefined ? values : field.value) || [];
  const selectedValueSet = new Set(effectiveValues.map((v) => v.value));
  const selectedOptions =
    field.options?.filter((opt) => selectedValueSet.has(opt.value)) || [];
  const unselectedOptions =
    field.options?.filter((opt) => !selectedValueSet.has(opt.value)) || [];

  // Stable position from the field's declared options. Matches the
  // picker's digit handler so what the badge says (e.g. "3") is the
  // option the keypress will actually toggle, regardless of how
  // selected items are reordered to the top in the display.
  const shortcutByValue = new Map<unknown, string>();
  if (field.options) {
    for (let i = 0; i < Math.min(field.options.length, MAX_OPTION_SHORTCUTS); i++) {
      shortcutByValue.set(field.options[i].value, String(i + 1));
    }
  }

  // Shared toggle so the row's onSelect and the Alt+N keyboard
  // shortcut both flow through the same logic — single-select picks
  // + closes, multi-select toggles.
  const toggleOption = (option: FilterOption<T>) => {
    const isSelected = selectedValueSet.has(option.value);
    if (isMultiSelect) {
      const next = isSelected
        ? effectiveValues.filter((v) => v.value !== option.value)
        : [...effectiveValues, option];
      if (
        !isSelected &&
        field.maxSelections &&
        next.length > field.maxSelections
      ) {
        return;
      }
      if (field.onValueChange) {
        field.onValueChange(next);
      } else {
        onChange(next);
      }
      return;
    }
    if (isSelected) {
      if (field.onValueChange) {
        field.onValueChange([]);
      } else {
        onChange([]);
      }
      return;
    }
    if (field.onValueChange) {
      field.onValueChange([option]);
    } else {
      onChange([option]);
    }
    onClose?.();
  };

  // Picker's outer handler only fires when focus stays on the outer
  // CommandInput. Once the user clicks into the submenu, this is the
  // handler that catches Alt+N — same allowlist (Alt only, digit 1-9,
  // sync `field.options`).
  const handleSubmenuKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!(e.altKey && !e.metaKey && !e.ctrlKey)) {
      return;
    }
    if (e.key < "1" || e.key > "9") {
      return;
    }
    if (!field.options || field.async) {
      return;
    }
    const idx = Number(e.key) - 1;
    const option = field.options[idx];
    if (!option) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    toggleOption(option as FilterOption<T>);
  };

  return (
    <>
      {field.searchable !== false && (
        <CommandInput
          onKeyDown={handleSubmenuKeyDown}
          onValueChange={setSearchInput}
          placeholder={
            field.placeholder ??
            context.i18n.placeholders.searchField(field.label || "")
          }
          value={searchInput}
        />
      )}
      <CommandList>
        <CommandEmpty>{context.i18n.noResultsFound}</CommandEmpty>

        {/* Selected items — top, with separator below */}
        {selectedOptions.length > 0 && (
          <CommandGroup>
            {selectedOptions.map((option) => (
              <CommandItem
                data-checked="true"
                key={String(option.value)}
                onSelect={() => {
                  if (isMultiSelect) {
                    const next = effectiveValues.filter(
                      (v) => v.value !== option.value
                    );
                    if (field.onValueChange) {
                      field.onValueChange(next);
                    } else {
                      onChange(next);
                    }
                  } else if (field.onValueChange) {
                    field.onValueChange([]);
                  } else {
                    onChange([]);
                  }
                }}
              >
                {isMultiSelect ? <MultiCheckbox checked /> : null}
                {field.renderOption ? (
                  field.renderOption({ field, isSelected: true, option })
                ) : (
                  <>
                    {option.icon && option.icon}
                    <span className="min-w-0 flex-1 truncate">
                      {option.label}
                    </span>
                  </>
                )}
                {/* `data-slot="command-shortcut"` is what tells the DS */}
                {/* CommandItem to hide its trailing CheckIcon (see */}
                {/* components/ui/command.tsx). Render the marker span */}
                {/* even when there's no Alt+N shortcut so the row's */}
                {/* leading MultiCheckbox isn't duplicated by the auto */}
                {/* CheckIcon on the right edge. */}
                <span
                  className="ml-auto flex shrink-0 items-center gap-0.5"
                  data-slot="command-shortcut"
                >
                  {shortcutByValue.has(option.value) ? (
                    <>
                      <Kbd className="h-4 min-w-4 px-1 py-0 text-[10px]">
                        {altLabel}
                      </Kbd>
                      <Kbd className="h-4 min-w-4 px-1 py-0 text-[10px]">
                        {shortcutByValue.get(option.value)}
                      </Kbd>
                    </>
                  ) : null}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Available items */}
        {unselectedOptions.length > 0 && (
          <>
            {selectedOptions.length > 0 && <CommandSeparator />}
            <CommandGroup>
              {unselectedOptions.map((option) => (
                <CommandItem
                  key={String(option.value)}
                  onSelect={() => {
                    if (isMultiSelect) {
                      const newValues = [...effectiveValues, option];
                      if (
                        field.maxSelections &&
                        newValues.length > field.maxSelections
                      ) {
                        return;
                      }
                      if (field.onValueChange) {
                        field.onValueChange(newValues);
                      } else {
                        onChange(newValues);
                      }
                    } else {
                      if (field.onValueChange) {
                        field.onValueChange([option]);
                      } else {
                        onChange([option]);
                      }
                      onClose?.();
                    }
                  }}
                  value={option.label}
                >
                  {isMultiSelect ? <MultiCheckbox checked={false} /> : null}
                  {field.renderOption ? (
                    field.renderOption({ field, isSelected: false, option })
                  ) : (
                    <>
                      {option.icon && option.icon}
                      <span className="min-w-0 flex-1 truncate">
                        {option.label}
                      </span>
                    </>
                  )}
                  {/* Same `data-slot="command-shortcut"` trick as the */}
                  {/* selected-row branch — suppresses the DS CheckIcon */}
                  {/* that CommandItem appends so the leading checkbox */}
                  {/* isn't duplicated on the right edge. */}
                  <span
                    className="ml-auto flex shrink-0 items-center gap-0.5"
                    data-slot="command-shortcut"
                  >
                    {shortcutByValue.has(option.value) ? (
                      <>
                        <Kbd className="h-4 min-w-4 px-1 py-0 text-[10px]">
                          {altLabel}
                        </Kbd>
                        <Kbd className="h-4 min-w-4 px-1 py-0 text-[10px]">
                          {shortcutByValue.get(option.value)}
                        </Kbd>
                      </>
                    ) : null}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </>
  );
}
