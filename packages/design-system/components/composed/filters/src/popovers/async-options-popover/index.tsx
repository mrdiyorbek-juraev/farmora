"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Checkbox } from "@repo/design-system/components/ui/checkbox";
import {
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@repo/design-system/components/ui/command";
import { Spinner } from "@repo/design-system/components/ui/spinner";
import { useEffect, useRef } from "react";
import { useFilterContext } from "../../context";
import { useAsyncOptions } from "../../hooks/use-async-options";
import type { FilterFieldConfig, FilterOption } from "../../types";

// Uses the DS Checkbox so async + static pickers stay consistent with
// the rest of the platform. The checkbox is non-interactive — the
// CommandItem's onSelect handles selection, so we don't wire onChange
// here; pointer-events-none keeps clicks bubbling up to the row.
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

interface AsyncOptionsPopoverProps<T = unknown> {
  field: FilterFieldConfig<T>;
  onChange: (values: FilterOption<T>[]) => void;
  onClose?: () => void;
  values: FilterOption<T>[];
}

// Renders the options list for a `select` / `multiselect` field whose options
// come from a server-driven loader (`field.async`). Returns Command children
// directly — meant to be embedded in an outer <Command> wrapper.
//
// Behavior:
//   - Selected options always render at the top (read from `values` directly,
//     since `Filter.values` carries full {value,label} pairs — no cache).
//   - Live options are appended below a separator.
//   - Search input is debounced (default 250ms) and triggers a fresh page-1
//     fetch each time.
//   - Bottom sentinel uses IntersectionObserver to load the next page when
//     visible — only fires when `hasMore` and not currently fetching.
//   - Loading / error states use design-system Spinner.
//
// Alt+N shortcuts are intentionally NOT supported for async fields:
// the list can scroll to 1000+ items and the visible order is volatile
// (search refines it on every keystroke), so "Alt+3 selects the 3rd
// loaded row" would point at different options as the user types.
// Static pickers still get shortcuts because their option set is
// stable and fully visible.
export function AsyncOptionsPopover<T = unknown>({
  field,
  onChange,
  onClose,
  values,
}: AsyncOptionsPopoverProps<T>) {
  const context = useFilterContext();

  if (!field.async) {
    throw new Error(
      "AsyncOptionsPopover used on a field without `async` config"
    );
  }

  const isMultiSelect = field.type === "multiselect" || values.length > 1;

  const {
    error,
    hasMore,
    isFetchingMore,
    isLoading,
    loadMore,
    options,
    retry,
    search,
    setSearch,
  } = useAsyncOptions<T>({ asyncOptions: field.async, enabled: true });

  const selectedValueSet = new Set(values.map((v) => v.value));
  const unselectedOptions = options.filter(
    (opt) => !selectedValueSet.has(opt.value)
  );

  // IntersectionObserver sentinel for paginating on scroll. The
  // sentinel lives inside CommandList which has its own
  // `overflow-y: auto` — if we leave the observer's root as the
  // viewport (default), the sentinel never enters it while the user
  // scrolls the list, and loadMore never fires. Walk up the tree to
  // find the closest scrollable ancestor and use it as the root so
  // the observer fires when the sentinel becomes visible inside the
  // list's own scroll viewport.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!(node && hasMore) || isFetchingMore || isLoading) {
      return;
    }
    let root: Element | null = node.parentElement;
    while (root && root !== document.body) {
      const overflow = window.getComputedStyle(root).overflowY;
      if (overflow === "auto" || overflow === "scroll" || overflow === "overlay") {
        break;
      }
      root = root.parentElement;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      // Small rootMargin pre-loads before the sentinel is fully in
      // view so the user doesn't see a loading flicker mid-scroll.
      { root: root && root !== document.body ? root : null, rootMargin: "80px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isFetchingMore, isLoading, loadMore]);

  const handleDeselect = (option: FilterOption<T>) => {
    const next = isMultiSelect
      ? values.filter((v) => v.value !== option.value)
      : [];
    if (field.onValueChange) {
      field.onValueChange(next);
    } else {
      onChange(next);
    }
  };

  const handleSelect = (option: FilterOption<T>) => {
    if (isMultiSelect) {
      const newValues = [...values, option];
      if (field.maxSelections && newValues.length > field.maxSelections) {
        return;
      }
      if (field.onValueChange) {
        field.onValueChange(newValues);
      } else {
        onChange(newValues);
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

  const renderResults = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center gap-2 px-3 py-6 text-center">
          <span className="text-muted-foreground text-sm">
            {context.i18n.noResultsFound}
          </span>
          <Button onClick={retry} size="sm" type="button" variant="link">
            Retry
          </Button>
        </div>
      );
    }
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-6">
          <Spinner className="size-4" />
        </div>
      );
    }
    if (unselectedOptions.length === 0) {
      return <CommandEmpty>{context.i18n.noResultsFound}</CommandEmpty>;
    }
    return (
      <CommandGroup>
        {unselectedOptions.map((option) => (
          <CommandItem
            key={String(option.value)}
            onSelect={() => handleSelect(option)}
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
            {/* Empty `data-slot="command-shortcut"` marker tells the */}
            {/* DS CommandItem to hide its trailing CheckIcon (see */}
            {/* components/ui/command.tsx), so the leading checkbox */}
            {/* isn't duplicated on the right edge. */}
            <span className="ml-auto" data-slot="command-shortcut" />
          </CommandItem>
        ))}
        {hasMore && (
          <div
            className="flex items-center justify-center py-2"
            ref={sentinelRef}
          >
            {isFetchingMore && <Spinner className="size-3.5" />}
          </div>
        )}
      </CommandGroup>
    );
  };

  return (
    <>
      {field.searchable !== false && (
        <CommandInput
          onValueChange={setSearch}
          placeholder={
            field.placeholder ??
            context.i18n.placeholders.searchField(field.label || "")
          }
          value={search}
        />
      )}
      <CommandList>
        {values.length > 0 && (
          <>
            <CommandGroup>
              {values.map((option) => (
                <CommandItem
                  data-checked="true"
                  key={String(option.value)}
                  onSelect={() => handleDeselect(option)}
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
                  <span className="ml-auto" data-slot="command-shortcut" />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}
        {renderResults()}
      </CommandList>
    </>
  );
}
