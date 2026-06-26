"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Kbd } from "@repo/design-system/components/ui/kbd";
import {
  ButtonGroup,
  ButtonGroupText,
} from "@repo/design-system/components/ui/button-group";
import { Calendar } from "@repo/design-system/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@repo/design-system/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@repo/design-system/components/ui/popover";
import { Switch } from "@repo/design-system/components/ui/switch";
import { cn } from "@repo/design-system/lib/utils";
import type { RegisterableHotkey } from "@tanstack/hotkeys";
import { useHotkey } from "@tanstack/react-hotkeys";
import { format } from "date-fns";
import {
  CalendarIcon,
  CheckIcon,
  ChevronRight,
  ListFilter,
  ListFilterPlus,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DateRange } from "react-day-picker";
import { DEFAULT_I18N } from "./constants";
import { FilterContext, useFilterContext } from "./context";
import {
  type AsyncDispatcher,
  FilterKeyboardContext,
  type FilterKeyboardContextValue,
} from "./context/keyboard";
import {
  flattenFields,
  getFieldsMap,
  getOperatorsForField,
  isFieldGroup,
  isGroupLevelField,
} from "./lib";
import { computeNextValues } from "./lib/keyboard-coordinator";
import { AsyncOptionsPopover } from "./popovers/async-options-popover";
import { DateTimeValuePopover } from "./popovers/datetime-value-popover";
import { NumberValuePopover } from "./popovers/number-value-popover";
import { StaticOptionsPopover } from "./popovers/static-options-popover";
import { TextValuePopover } from "./popovers/text-value-popover";
import { TimeValuePopover } from "./popovers/time-value-popover";
import type {
  Filter,
  FilterFieldConfig,
  FilterI18nConfig,
  FilterOperatorDropdownProps,
  FilterOption,
  FiltersContentProps,
  FiltersProps,
  FilterValueSelectorProps,
  SelectOptionsPopoverProps,
} from "./types";

// Wrap a raw value as a FilterOption. Used everywhere a non-select field
// produces a value (text input, number input, date pickers, etc.) so that
// `Filter.values` is uniformly `FilterOption<T>[]` regardless of field type.
export const toOption = <T,>(value: T, label?: string): FilterOption<T> => ({
  value,
  label: label ?? String(value),
});

export const createFilter = <T = unknown>(
  field: string,
  operator?: string,
  values: FilterOption<T>[] = []
): Filter<T> => ({
  id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
  field,
  operator: operator || "is",
  values,
});

function renderSelectLabel<T>(
  options: FilterOption<T>[],
  i18n: FilterI18nConfig
) {
  if (options.length === 1) {
    return options[0].label;
  }
  if (options.length > 1) {
    return `${options.length} ${i18n.selectedCount}`;
  }
  return i18n.select;
}

// Map a content-button size to the matching icon-only Button size so a
// chip row (text buttons + X-remove icon button) stays at a single
// height. The earlier mapping returned "icon-sm" (32×32) for "xs"
// content (24px), which made the X taller than the rest of the chip
// and forced the chip to overflow narrow toolbars (e.g. our 35px bar).
function pickIconSize(size: "xs" | "sm" | "default") {
  if (size === "xs") {
    return "icon-xs" as const;
  }
  if (size === "sm") {
    return "icon-sm" as const;
  }
  return "icon" as const;
}

function FilterRemoveButton({ onClick }: { onClick: () => void }) {
  const context = useFilterContext();
  const buttonSize = pickIconSize(context.size);

  return (
    <Button
      aria-label="Remove filter"
      data-slot="filters-remove"
      onClick={onClick}
      size={buttonSize}
      type="button"
      variant="outline"
    >
      <X />
    </Button>
  );
}

function FilterOperatorDropdown<T = unknown>({
  field,
  operator,
  values,
  onChange,
}: FilterOperatorDropdownProps<T>) {
  const context = useFilterContext();
  const operators = getOperatorsForField(field, values, context.i18n);

  const operatorLabel =
    operators.find((op) => op.value === operator)?.label ||
    context.i18n.helpers.formatOperator(operator);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="text-muted-foreground"
          size={context.size}
          type="button"
          variant="outline"
        >
          {operatorLabel}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-fit min-w-fit">
        {operators.map((op) => (
          <DropdownMenuItem
            className="flex items-center gap-2"
            key={op.value}
            onClick={() => onChange(op.value)}
          >
            <span>{op.label}</span>
            <CheckIcon
              className={cn(
                "ml-auto size-3.5 shrink-0",
                op.value !== operator && "opacity-0"
              )}
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SelectOptionsPopover<T = unknown>({
  field,
  values,
  onChange,
  onClose,
  operator,
}: SelectOptionsPopoverProps<T> & { operator?: string }) {
  const [open, setOpen] = useState(false);
  const context = useFilterContext();

  const isMultiSelect = field.type === "multiselect" || values.length > 1;

  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  // Trigger label reads directly from `values` (which carry their labels via
  // FilterOption<T>) so it works for async fields too — they have no static
  // `field.options` to look up against.
  const labelOptions = values;

  // Per-field `renderSelectedValues` wins, then legacy `customValueRenderer`,
  // then the default icon-stack + label. `operator` is passed through from
  // the chip so consumers can branch on single vs between, etc.
  const renderTriggerContent = () => {
    if (field.renderSelectedValues) {
      return field.renderSelectedValues({
        field,
        operator: operator ?? "",
        values,
      });
    }
    if (field.customValueRenderer) {
      return field.customValueRenderer(values, field.options || []);
    }
    return (
      <>
        {labelOptions.some((opt) => opt.icon) && (
          <div
            className={cn(
              "flex items-center -space-x-1.5",
              field.selectedOptionsClassName
            )}
          >
            {labelOptions
              .slice(0, 3)
              .map((option) =>
                option.icon ? (
                  <div key={String(option.value)}>{option.icon}</div>
                ) : null
              )}
          </div>
        )}
        {renderSelectLabel(labelOptions, context.i18n)}
      </>
    );
  };

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button size={context.size} type="button" variant="outline">
          <div className="flex items-center gap-1.5">{renderTriggerContent()}</div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        // Matches the Add Filter submenu width (280px). Anything
        // narrower clips the Alt+N badges off the right edge on
        // option rows that already render a checkbox + icon + label.
        className={cn("min-w-[280px] p-0", field.className)}
      >
        <Command shouldFilter={!field.async}>
          <SelectedFieldOptions
            field={field}
            onChange={(next) => {
              onChange(next);
              if (!isMultiSelect) {
                handleClose();
              }
            }}
            onClose={handleClose}
            values={values}
          />
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ─── Calendar-based date pickers ─────────────────────────────────────

function formatDateLabel(date: Date) {
  return format(date, "LLL dd, y");
}

function DateRangeLabel({ range }: { range?: DateRange }) {
  if (!range?.from) {
    return null;
  }
  if (range.to) {
    return (
      <span>
        {formatDateLabel(range.from)} – {formatDateLabel(range.to)}
      </span>
    );
  }
  return <span>{formatDateLabel(range.from)}</span>;
}

// Linear-style date range presets. Computed at click time so the
// values always reflect "now". Each preset commits both bounds and
// closes the popover immediately — same UX as a calendar pick.
function getDateRangePresets(): { label: string; range: () => DateRange }[] {
  const startOfDay = (d: Date) => {
    const out = new Date(d);
    out.setHours(0, 0, 0, 0);
    return out;
  };
  const endOfDay = (d: Date) => {
    const out = new Date(d);
    out.setHours(23, 59, 59, 999);
    return out;
  };
  return [
    {
      label: "Today",
      range: () => {
        const now = new Date();
        return { from: startOfDay(now), to: endOfDay(now) };
      },
    },
    {
      label: "Yesterday",
      range: () => {
        const y = new Date();
        y.setDate(y.getDate() - 1);
        return { from: startOfDay(y), to: endOfDay(y) };
      },
    },
    {
      label: "Last 7 days",
      range: () => {
        const to = new Date();
        const from = new Date();
        from.setDate(from.getDate() - 6);
        return { from: startOfDay(from), to: endOfDay(to) };
      },
    },
    {
      label: "Last 30 days",
      range: () => {
        const to = new Date();
        const from = new Date();
        from.setDate(from.getDate() - 29);
        return { from: startOfDay(from), to: endOfDay(to) };
      },
    },
    {
      label: "This month",
      range: () => {
        const now = new Date();
        return {
          from: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)),
          to: endOfDay(now),
        };
      },
    },
    {
      label: "Last month",
      range: () => {
        const now = new Date();
        const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const to = new Date(now.getFullYear(), now.getMonth(), 0);
        return { from: startOfDay(from), to: endOfDay(to) };
      },
    },
  ];
}

function DateRangeEditor<T>({
  range,
  onChange,
  onClose,
}: {
  range?: DateRange;
  onChange: (values: FilterOption<T>[]) => void;
  onClose: () => void;
}) {
  const presets = getDateRangePresets();
  const applyPreset = (next: DateRange) => {
    if (!(next.from && next.to)) {
      return;
    }
    onChange([
      toOption(next.from.toISOString() as T),
      toOption(next.to.toISOString() as T),
    ]);
    onClose();
  };
  return (
    <div className="flex gap-3">
      {/* Linear-style preset rail on the left so the most-used
          ranges are one click away. Calendar still owns custom
          ranges. */}
      <div className="flex min-w-[120px] flex-col gap-0.5 border-border border-r pr-3">
        {presets.map((preset) => (
          <button
            className="rounded-md px-2 py-1 text-left text-sm hover:bg-accent"
            key={preset.label}
            onClick={() => applyPreset(preset.range())}
            type="button"
          >
            {preset.label}
          </button>
        ))}
      </div>
      <Calendar
        defaultMonth={range?.from}
        mode="range"
        numberOfMonths={2}
        onSelect={(selected) => {
          if (!(selected?.from && selected?.to)) {
            return;
          }
          onChange([
            toOption(selected.from.toISOString() as T),
            toOption(selected.to.toISOString() as T),
          ]);
          onClose();
        }}
        selected={range}
      />
    </div>
  );
}

function DateRangePicker<T>({
  children,
  range,
  onChange,
  size,
  select,
}: {
  children?: React.ReactNode;
  range?: DateRange;
  onChange: (values: FilterOption<T>[]) => void;
  size: "xs" | "sm" | "default";
  select: string;
}) {
  const [open, setOpen] = useState(false);

  if (!children) {
    return (
      <DateRangeEditor
        onChange={onChange}
        onClose={() => {
          /* no-op when bare; caller controls lifecycle */
        }}
        range={range}
      />
    );
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        {children ?? (
          <Button size={size} type="button" variant="outline">
            <CalendarIcon className="text-muted-foreground" />
            {range?.from ? (
              <DateRangeLabel range={range} />
            ) : (
              <span className="text-muted-foreground">{select}</span>
            )}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto">
        <DateRangeEditor
          onChange={onChange}
          onClose={() => setOpen(false)}
          range={range}
        />
      </PopoverContent>
    </Popover>
  );
}

// Linear-style single-date presets. Same shape as the range presets
// but one-day commits — useful for "before"/"after"/"is" operators.
function getSingleDatePresets(): { label: string; date: () => Date }[] {
  const startOfDay = (d: Date) => {
    const out = new Date(d);
    out.setHours(0, 0, 0, 0);
    return out;
  };
  return [
    { label: "Today", date: () => startOfDay(new Date()) },
    {
      label: "Yesterday",
      date: () => {
        const y = new Date();
        y.setDate(y.getDate() - 1);
        return startOfDay(y);
      },
    },
    {
      label: "7 days ago",
      date: () => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return startOfDay(d);
      },
    },
    {
      label: "30 days ago",
      date: () => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return startOfDay(d);
      },
    },
  ];
}

function SingleDateEditor<T>({
  date,
  onChange,
  onClose,
}: {
  date?: Date;
  onChange: (values: FilterOption<T>[]) => void;
  onClose: () => void;
}) {
  const presets = getSingleDatePresets();
  const applyPreset = (next: Date) => {
    onChange([toOption(next.toISOString() as T)]);
    onClose();
  };
  return (
    <div className="flex gap-3">
      <div className="flex min-w-[120px] flex-col gap-0.5 border-border border-r pr-3">
        {presets.map((preset) => (
          <button
            className="rounded-md px-2 py-1 text-left text-sm hover:bg-accent"
            key={preset.label}
            onClick={() => applyPreset(preset.date())}
            type="button"
          >
            {preset.label}
          </button>
        ))}
      </div>
      <Calendar
        defaultMonth={date}
        mode="single"
        onSelect={(selected) => {
          if (!selected) {
            return;
          }
          onChange([toOption(selected.toISOString() as T)]);
          onClose();
        }}
        selected={date}
      />
    </div>
  );
}

function SingleDatePicker<T>({
  children,
  date,
  onChange,
  size,
  select,
}: {
  children?: React.ReactNode;
  date?: Date;
  onChange: (values: FilterOption<T>[]) => void;
  size: "xs" | "sm" | "default";
  select: string;
}) {
  const [open, setOpen] = useState(false);

  if (!children) {
    return (
      <SingleDateEditor
        date={date}
        onChange={onChange}
        onClose={() => {
          /* no-op when bare; caller controls lifecycle */
        }}
      />
    );
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        {children ?? (
          <Button size={size} type="button" variant="outline">
            <CalendarIcon className="text-muted-foreground" />
            {date ? (
              <span>{formatDateLabel(date)}</span>
            ) : (
              <span className="text-muted-foreground">{select}</span>
            )}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto">
        <SingleDateEditor
          date={date}
          onChange={onChange}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}

// ─── Field-type value renderers ─────────────────────────────────────

function BooleanValue<T>({
  field,
  values,
  onChange,
}: {
  field: FilterFieldConfig<T>;
  values: FilterOption<T>[];
  onChange: (v: FilterOption<T>[]) => void;
}) {
  const context = useFilterContext();
  const isChecked = values[0]?.value === true;
  const onLabel = field.onLabel || context.i18n.true;
  const offLabel = field.offLabel || context.i18n.false;

  return (
    <ButtonGroupText className="gap-2">
      <Switch
        checked={isChecked}
        onCheckedChange={(checked) => onChange([toOption(checked as T)])}
      />
      {field.onLabel && field.offLabel ? (
        <span className="text-muted-foreground text-xs">
          {isChecked ? onLabel : offLabel}
        </span>
      ) : null}
    </ButtonGroupText>
  );
}

// ─── Filter value selector ──────────────────────────────────────────

function parseDateRange(values: unknown[]): DateRange | undefined {
  const startStr = (values[0] as string) || "";
  const endStr = (values[1] as string) || "";
  const from = startStr ? new Date(startStr) : undefined;
  const to = endStr ? new Date(endStr) : undefined;
  return from || to ? { from, to } : undefined;
}

// Resolves the chip third-section override. Returns the consumer-rendered
// node (wrapped in ButtonGroupText) when applicable, or null to fall
// through to the default field-type popover. For select/multiselect the
// override is handled inside SelectOptionsPopover's trigger so the picker
// still opens on click; here we only short-circuit for non-select types.
function getOverrideContent<T>(
  field: FilterFieldConfig<T>,
  values: FilterOption<T>[],
  operator: string,
  onChange: (values: FilterOption<T>[]) => void
): React.ReactNode | null {
  if (field.customRenderer) {
    return (
      <ButtonGroupText>
        {field.customRenderer({ field, values, onChange, operator })}
      </ButtonGroupText>
    );
  }
  if (field.type === "select" || field.type === "multiselect") {
    return null;
  }
  const rendered = field.renderSelectedValues?.({ field, operator, values });
  if (rendered === undefined) {
    return null;
  }
  return <ButtonGroupText>{rendered}</ButtonGroupText>;
}

function FilterValueSelector<T = unknown>({
  field,
  values,
  onChange,
  operator,
  onRemove,
}: FilterValueSelectorProps<T> & {
  onRemove: () => void;
}) {
  const context = useFilterContext();

  if (operator === "empty" || operator === "not_empty") {
    return null;
  }

  const override = getOverrideContent(field, values, operator, onChange);
  if (override !== null) {
    return <>{override}</>;
  }

  switch (field.type) {
    case "boolean": {
      return <BooleanValue field={field} onChange={onChange} values={values} />;
    }
    case "time": {
      const label = (values[0]?.value as string) || context.i18n.select;
      return (
        <TimeValuePopover<T>
          field={field}
          onChange={onChange}
          onRemove={onRemove}
          operator={operator}
          values={values}
        >
          <Button size={context.size} type="button" variant="outline">
            <span className="max-w-40 truncate">{label}</span>
          </Button>
        </TimeValuePopover>
      );
    }
    case "datetime": {
      const label = (values[0]?.value as string) || context.i18n.select;
      return (
        <DateTimeValuePopover<T>
          field={field}
          onChange={onChange}
          onRemove={onRemove}
          operator={operator}
          values={values}
        >
          <Button size={context.size} type="button" variant="outline">
            <span className="max-w-48 truncate">{label}</span>
          </Button>
        </DateTimeValuePopover>
      );
    }
    case "email":
    case "url":
    case "tel":
    case "text": {
      const label = (values[0]?.value as string) || context.i18n.select;
      return (
        <TextValuePopover<T>
          field={field}
          onChange={onChange}
          onRemove={onRemove}
          values={values}
        >
          <Button size={context.size} type="button" variant="outline">
            <span className="max-w-40 truncate">{label}</span>
          </Button>
        </TextValuePopover>
      );
    }
    case "daterange": {
      if (operator === "before" || operator === "after") {
        const dateStr = (values[0]?.value as string) || "";
        const dateVal = dateStr ? new Date(dateStr) : undefined;
        return (
          <SingleDatePicker<T>
            date={dateVal}
            onChange={onChange}
            select={context.i18n.select}
            size={context.size}
          >
            <Button size={context.size} type="button" variant="outline">
              <CalendarIcon className="text-muted-foreground" />
              {dateVal ? (
                <span>{formatDateLabel(dateVal)}</span>
              ) : (
                <span className="text-muted-foreground">
                  {context.i18n.select}
                </span>
              )}
            </Button>
          </SingleDatePicker>
        );
      }
      const range = parseDateRange(values.map((v) => v.value));
      return (
        <DateRangePicker<T>
          onChange={onChange}
          range={range}
          select={context.i18n.select}
          size={context.size}
        >
          <Button size={context.size} type="button" variant="outline">
            <CalendarIcon className="text-muted-foreground" />
            {range?.from ? (
              <DateRangeLabel range={range} />
            ) : (
              <span className="text-muted-foreground">
                {context.i18n.select}
              </span>
            )}
          </Button>
        </DateRangePicker>
      );
    }
    case "number": {
      const isBetween = operator === "between" || operator === "not_between";
      const label = (() => {
        if (isBetween) {
          const min = values[0]?.value;
          const max = values[1]?.value;
          if (min === undefined && max === undefined) {
            return context.i18n.select;
          }
          return `${min ?? ""} – ${max ?? ""}`;
        }
        return values[0]?.value === undefined
          ? context.i18n.select
          : String(values[0].value);
      })();
      return (
        <NumberValuePopover<T>
          field={field}
          onChange={onChange}
          onRemove={onRemove}
          operator={operator}
          values={values}
        >
          <Button size={context.size} type="button" variant="outline">
            <span className="max-w-40 truncate">{label}</span>
          </Button>
        </NumberValuePopover>
      );
    }
    case "date": {
      const dateStr = (values[0]?.value as string) || "";
      const dateVal = dateStr ? new Date(dateStr) : undefined;
      return (
        <SingleDatePicker<T>
          date={dateVal}
          onChange={onChange}
          select={context.i18n.select}
          size={context.size}
        >
          <Button size={context.size} type="button" variant="outline">
            <CalendarIcon className="text-muted-foreground" />
            {dateVal ? (
              <span>{formatDateLabel(dateVal)}</span>
            ) : (
              <span className="text-muted-foreground">
                {context.i18n.select}
              </span>
            )}
          </Button>
        </SingleDatePicker>
      );
    }
    case "select":
    case "multiselect": {
      return (
        <SelectOptionsPopover
          field={field}
          onChange={onChange}
          operator={operator}
          values={values}
        />
      );
    }
    default: {
      return (
        <SelectOptionsPopover
          field={field}
          onChange={onChange}
          operator={operator}
          values={values}
        />
      );
    }
  }
}

// Dispatch between static and async options inside the Add Filter overlay.
// Returns Command children directly so the parent <Command> wrapper provides
// padding/background only once.
function SelectedFieldOptions<T = unknown>({
  field,
  values,
  onChange,
  onClose,
}: {
  field: FilterFieldConfig<T>;
  values: FilterOption<T>[];
  onChange: (values: FilterOption<T>[]) => void;
  onClose?: () => void;
}) {
  if (field.async) {
    return (
      <AsyncOptionsPopover<T>
        field={field}
        onChange={onChange}
        onClose={onClose}
        values={values}
      />
    );
  }
  return (
    <StaticOptionsPopover<T>
      field={field}
      onChange={onChange}
      onClose={onClose}
      values={values}
    />
  );
}

export const FiltersContent = <T = unknown>({
  filters,
  fields,
  onChange,
}: FiltersContentProps<T>) => {
  const context = useFilterContext();
  const fieldsMap = useMemo(() => getFieldsMap(fields), [fields]);

  const updateFilter = useCallback(
    (filterId: string, updates: Partial<Filter<T>>) => {
      onChange(
        filters.map((filter) => {
          if (filter.id === filterId) {
            const updatedFilter = { ...filter, ...updates };
            if (updates.operator) {
              const noValue =
                updates.operator === "empty" ||
                updates.operator === "not_empty";
              const wasRange =
                filter.operator === "between" ||
                filter.operator === "not_between";
              const isRange =
                updates.operator === "between" ||
                updates.operator === "not_between";

              if (noValue) {
                updatedFilter.values = [];
              } else if (wasRange !== isRange) {
                updatedFilter.values = [];
              }
            }
            return updatedFilter;
          }
          return filter;
        })
      );
    },
    [filters, onChange]
  );

  const removeFilter = useCallback(
    (filterId: string) => {
      onChange(filters.filter((filter) => filter.id !== filterId));
    },
    [filters, onChange]
  );

  return (
    <div className={cn("flex flex-wrap items-center gap-2", context.className)}>
      {filters.map((filter) => {
        const field = fieldsMap[filter.field];
        if (!field) {
          return null;
        }

        return (
          <ButtonGroup className="shrink-0" data-slot="filter-item" key={filter.id}>
            <ButtonGroupText className="whitespace-nowrap">
              {field.icon}
              {field.label}
            </ButtonGroupText>

            <FilterOperatorDropdown<T>
              field={field}
              onChange={(operator) => updateFilter(filter.id, { operator })}
              operator={filter.operator}
              values={filter.values}
            />

            <FilterValueSelector<T>
              field={field}
              onChange={(values) => updateFilter(filter.id, { values })}
              onRemove={() => removeFilter(filter.id)}
              operator={filter.operator}
              values={filter.values}
            />

            <FilterRemoveButton onClick={() => removeFilter(filter.id)} />
          </ButtonGroup>
        );
      })}
    </div>
  );
};

// Dispatch the right value popover for a field that doesn't yet have a chip.
// We render the popover in "bare" mode (no `children` prop) so it returns
// just the editor body, which we mount inside the field-picker popover —
// same component, same look, same Enter/Escape/commit logic as the edit
// path. No nested popovers, no handoff race.
function PendingValueInput<T>({
  field,
  onCommit,
  onCancel,
}: {
  field: FilterFieldConfig<T>;
  onCommit: (values: FilterOption<T>[]) => void;
  onCancel: () => void;
}) {
  const operator =
    field.defaultOperator ||
    (field.type === "daterange" || field.type === "numberrange"
      ? "between"
      : "is");

  if (field.type === "date") {
    return (
      <SingleDatePicker<T>
        date={undefined}
        onChange={onCommit}
        select=""
        size="sm"
      />
    );
  }
  if (field.type === "daterange") {
    return (
      <DateRangePicker<T>
        onChange={onCommit}
        range={undefined}
        select=""
        size="sm"
      />
    );
  }
  if (field.type === "number") {
    return (
      <NumberValuePopover<T>
        field={field}
        onChange={onCommit}
        onRemove={onCancel}
        operator={operator}
        values={[]}
      />
    );
  }
  if (field.type === "time") {
    return (
      <TimeValuePopover<T>
        field={field}
        onChange={onCommit}
        onRemove={onCancel}
        operator={operator}
        values={[]}
      />
    );
  }
  if (field.type === "datetime") {
    return (
      <DateTimeValuePopover<T>
        field={field}
        onChange={onCommit}
        onRemove={onCancel}
        operator={operator}
        values={[]}
      />
    );
  }
  // text / email / url / tel
  return (
    <TextValuePopover<T>
      field={field}
      onChange={onCommit}
      onRemove={onCancel}
      values={[]}
    />
  );
}

// Thin wrapper around `useHotkey` that takes a single key. Lets us
// render a fixed list of hotkey bindings (one node per key) and keep
// the hook count stable across renders, since `useHotkey` only accepts
// a single RegisterableHotkey per call.
function PickerHotkey({
  hotkey,
  enabled,
  onTrigger,
}: {
  hotkey: RegisterableHotkey;
  enabled: boolean;
  onTrigger: (event: KeyboardEvent) => void;
}) {
  useHotkey(hotkey, onTrigger, { enabled, preventDefault: true });
  return null;
}

// Keys the picker listens for to drive single-letter field shortcuts.
// `RegisterableHotkey` requires uppercase letter keys; the handler
// still lowercases `event.key` before looking up the field.
const PICKER_LETTER_KEYS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
  "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T",
  "U", "V", "W", "X", "Y", "Z",
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
] as const;

// Alt+1..9 picks the Nth option in the open submenu's static list.
const SUBMENU_ALT_DIGIT_KEYS = [
  "Alt+1", "Alt+2", "Alt+3", "Alt+4", "Alt+5",
  "Alt+6", "Alt+7", "Alt+8", "Alt+9",
] as const;

// Assign single-letter (then digit-fallback) keyboard shortcuts to a
// list of fields. Linear-style: prefer the first available letter in
// the field's label; if every letter is taken, fall back to digits
// 1-9 then 0. Fields with no available shortcut are omitted from the
// returned map.
function assignFieldShortcuts<T>(
  fields: FilterFieldConfig<T>[]
): Map<string, string> {
  const out = new Map<string, string>();
  const used = new Set<string>();
  for (const field of fields) {
    if (!field.key) {
      continue;
    }
    const label = (field.label ?? "").toLowerCase();
    for (const ch of label) {
      if (ch >= "a" && ch <= "z" && !used.has(ch)) {
        out.set(field.key, ch);
        used.add(ch);
        break;
      }
    }
  }
  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
  let digitIdx = 0;
  for (const field of fields) {
    if (!field.key || out.has(field.key)) {
      continue;
    }
    while (digitIdx < digits.length && used.has(digits[digitIdx])) {
      digitIdx++;
    }
    if (digitIdx >= digits.length) {
      break;
    }
    out.set(field.key, digits[digitIdx]);
    used.add(digits[digitIdx]);
    digitIdx++;
  }
  return out;
}

// Resolve the operator a new filter chip should default to when the
// field config doesn't declare one. Text-like fields default to
// `contains` (matches what users actually want — substring search);
// multiselect defaults to `is_any_of`; everything else falls back to
// the legacy `is`. Per-field `defaultOperator` still wins when set.
function pickDefaultOperator(type: string | undefined): string {
  if (type === "multiselect") {
    return "is_any_of";
  }
  if (
    type === "text" ||
    type === "email" ||
    type === "url" ||
    type === "tel"
  ) {
    return "contains";
  }
  return "is";
}

// Contents of a per-row submenu Popover. Dispatches by field type:
// static / async option list for select-style fields, inline value
// editor for text/number/date/etc. Boolean / numberrange types
// commit immediately on row click so they never render a submenu.
function FieldSubmenu<T>({
  field,
  values,
  onChange,
  onCommit,
  onClose,
}: {
  field: FilterFieldConfig<T>;
  values: FilterOption<T>[];
  onChange: (values: FilterOption<T>[]) => void;
  onCommit: (values: FilterOption<T>[]) => void;
  onClose: () => void;
}) {
  if (field.type === "select" || field.type === "multiselect") {
    return (
      // Widened to 280px so the Alt+N shortcut chip sits visibly at
      // the right edge of every row instead of crowding short labels.
      <Command
        className="flex max-h-[400px] min-w-[280px] max-w-[420px] flex-col"
        shouldFilter={!field.async}
      >
        <SelectedFieldOptions
          field={field}
          onChange={onChange}
          onClose={onClose}
          values={values}
        />
      </Command>
    );
  }
  // text / email / url / tel / number / time / date / datetime / daterange
  return (
    <div className="p-2.5">
      <PendingValueInput
        field={field}
        onCancel={onClose}
        onCommit={onCommit}
      />
    </div>
  );
}

// One row in the field-list popover. Owns its own Popover whose
// trigger anchors to the row, content opens side="right". Open/close
// is driven by the parent's `openSubKey` so only one submenu is
// visible at a time. Hover handlers update that shared state with
// small delays so dragging the mouse across rows doesn't flash.
function FieldRow<T>({
  field,
  isImmediate,
  isOpen,
  shortcut,
  values,
  onHoverOpen,
  onHoverClose,
  onClick,
  onChange,
  onCommit,
  onCloseAll,
  onCloseSubmenu,
}: {
  field: FilterFieldConfig<T>;
  isImmediate: boolean;
  isOpen: boolean;
  shortcut?: string;
  values: FilterOption<T>[];
  onHoverOpen: (key: string) => void;
  onHoverClose: () => void;
  onClick: () => void;
  onChange: (values: FilterOption<T>[]) => void;
  onCommit: (values: FilterOption<T>[]) => void;
  onCloseAll: () => void;
  onCloseSubmenu: () => void;
}) {
  const key = field.key as string;
  return (
    <Popover
      onOpenChange={(open) => {
        if (!open && isOpen) {
          onCloseSubmenu();
        }
      }}
      open={isOpen}
    >
      <PopoverAnchor asChild>
        <CommandItem
          onMouseEnter={() => onHoverOpen(key)}
          onMouseLeave={onHoverClose}
          onSelect={onClick}
          value={key}
        >
          {field.icon}
          <span className="min-w-0 flex-1 truncate">{field.label}</span>
          {/* CommandItem unconditionally appends a `<CheckIcon class="ml-auto */}
          {/* opacity-0">`. Even invisible it claims the right edge of the row */}
          {/* and pushes our shortcut/chevron ~20px to the left. The DS opts */}
          {/* out of that CheckIcon when a descendant carries */}
          {/* `data-slot="command-shortcut"` — set it here so the slot is */}
          {/* suppressed and our trailing group reaches the actual edge. */}
          <span
            className="ml-auto flex shrink-0 items-center gap-2"
            data-slot="command-shortcut"
          >
            {shortcut ? (
              <Kbd className="h-4 min-w-4 px-1 py-0 text-[10px]">
                {shortcut.toUpperCase()}
              </Kbd>
            ) : null}
            {isImmediate ? null : (
              <ChevronRight className="size-3 shrink-0 text-muted-foreground/50" />
            )}
          </span>
        </CommandItem>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-fit p-0"
        // Inherits the parent picker's marker so the document-level
        // Alt+N / Esc coordinator fires for keystrokes that originate
        // inside the submenu portal too.
        data-filter-picker=""
        onMouseEnter={() => onHoverOpen(key)}
        onMouseLeave={onHoverClose}
        // Don't pull focus from the parent popover's search input. The
        // submenu's own search input gets focus only on click-through.
        onOpenAutoFocus={(e) => e.preventDefault()}
        side="right"
        sideOffset={6}
      >
        <FieldSubmenu
          field={field}
          onChange={onChange}
          onClose={onCloseAll}
          onCommit={onCommit}
          values={values}
        />
      </PopoverContent>
    </Popover>
  );
}

export function Filters<T = unknown>({
  filters,
  fields,
  onChange,
  className,
  showAddButton = true,
  addButtonText,
  addButtonIcon,
  addButtonClassName,
  addButton,
  size = "default",
  i18n,
  showSearchInput = true,
  trigger,
  popoverContentClassName,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: FiltersProps<T>) {
  // Allow either uncontrolled (legacy) or controlled usage. Per-page
  // wrappers thread `open` + `onOpenChange` so a hotkey (e.g. `F`) can
  // pop the picker without owning the trigger button.
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpenControlled = controlledOpen !== undefined;
  const addFilterOpen = isOpenControlled ? controlledOpen : internalOpen;
  const setAddFilterOpen = useCallback(
    (next: boolean) => {
      if (isOpenControlled) {
        controlledOnOpenChange?.(next);
      } else {
        setInternalOpen(next);
      }
    },
    [controlledOnOpenChange, isOpenControlled]
  );
  // Which row's submenu is currently open. Single-state coordination
  // so only one submenu is ever visible — switching between rows is
  // instant (no fade overlap). Driven by hover handlers with small
  // delays (so dragging the mouse across rows doesn't flash submenus
  // open/closed) AND by direct clicks (instant). Replaces the earlier
  // split-pane design that always rendered the right column and
  // thrashed on hover.
  const [openSubKey, setOpenSubKey] = useState<string | null>(null);

  // Controlled search value for the picker's CommandInput. We control
  // it so the keyboard shortcut handler can distinguish "no search
  // typed yet, treat letter as shortcut" from "user is searching,
  // letter goes into search". Reset to "" whenever the popover opens
  // so each open starts fresh.
  const [pickerSearch, setPickerSearch] = useState("");

  // Hover delay timers. Keep one open + one close timer so a
  // mouse-enter on one row cancels a pending close from the previous
  // row. Refs (not state) — they don't drive rendering.
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimers = () => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };
  const requestOpenSub = useCallback((key: string) => {
    clearTimers();
    openTimerRef.current = setTimeout(() => {
      setOpenSubKey(key);
    }, 80);
  }, []);
  const requestCloseSub = useCallback(() => {
    clearTimers();
    closeTimerRef.current = setTimeout(() => {
      setOpenSubKey(null);
    }, 160);
  }, []);
  const openSubImmediate = useCallback((key: string) => {
    clearTimers();
    setOpenSubKey(key);
  }, []);
  const closeSubImmediate = useCallback(() => {
    clearTimers();
    setOpenSubKey(null);
  }, []);
  useEffect(() => clearTimers, []);

  const mergedI18n: FilterI18nConfig = {
    ...DEFAULT_I18N,
    ...i18n,
    operators: {
      ...DEFAULT_I18N.operators,
      ...i18n?.operators,
    },
    placeholders: {
      ...DEFAULT_I18N.placeholders,
      ...i18n?.placeholders,
    },
    validation: {
      ...DEFAULT_I18N.validation,
      ...i18n?.validation,
    },
  };

  const fieldsMap = useMemo(() => getFieldsMap(fields), [fields]);

  const updateFilter = useCallback(
    (filterId: string, updates: Partial<Filter<T>>) => {
      onChange(
        filters.map((filter) => {
          if (filter.id === filterId) {
            const updatedFilter = { ...filter, ...updates };
            if (updates.operator) {
              const noValue =
                updates.operator === "empty" ||
                updates.operator === "not_empty";
              const wasRange =
                filter.operator === "between" ||
                filter.operator === "not_between";
              const isRange =
                updates.operator === "between" ||
                updates.operator === "not_between";

              if (noValue) {
                updatedFilter.values = [];
              } else if (wasRange !== isRange) {
                updatedFilter.values = [];
              }
            }
            return updatedFilter;
          }
          return filter;
        })
      );
    },
    [filters, onChange]
  );

  const removeFilter = useCallback(
    (filterId: string) => {
      onChange(filters.filter((filter) => filter.id !== filterId));
    },
    [filters, onChange]
  );

  const closeAll = useCallback(() => {
    clearTimers();
    setOpenSubKey(null);
    setAddFilterOpen(false);
  }, []);

  // Immediate-commit row click (boolean / numberrange). Creates the
  // chip and closes the whole picker. Skip re-adding if a filter for
  // this field already exists — the row stays visible in the picker
  // so users can re-pick to "toggle off" via the chip remove button,
  // but we don't want to silently dupe it on a second click.
  const addFilterImmediate = useCallback(
    (field: FilterFieldConfig<T>) => {
      if (!field.key) {
        return;
      }
      if (filters.some((f) => f.field === field.key)) {
        closeAll();
        return;
      }
      const isRangeType = field.type === "numberrange";
      const defaultOperator =
        field.defaultOperator || (isRangeType ? "between" : "is");
      const defaultValues: unknown[] =
        field.type === "numberrange"
          ? [field.min || 0, field.max || 100]
          : [false];
      const newFilter = createFilter<T>(
        field.key,
        defaultOperator,
        (defaultValues as T[]).map((v) => toOption(v))
      );
      onChange([...filters, newFilter]);
      closeAll();
    },
    [closeAll, filters, onChange]
  );

  const addFilterWithOption = useCallback(
    (
      field: FilterFieldConfig<T>,
      values: FilterOption<T>[],
      closePopover = true
    ) => {
      if (!field.key) {
        return;
      }

      const defaultOperator =
        field.defaultOperator || pickDefaultOperator(field.type);

      const existingFilterIndex = filters.findIndex(
        (f) => f.field === field.key
      );

      if (existingFilterIndex >= 0) {
        const updatedFilters = [...filters];
        updatedFilters[existingFilterIndex] = {
          ...updatedFilters[existingFilterIndex],
          values,
        };
        onChange(updatedFilters);
      } else {
        const newFilter = createFilter<T>(field.key, defaultOperator, values);
        onChange([...filters, newFilter]);
      }

      if (closePopover) {
        closeAll();
      }
    },
    [closeAll, filters, onChange]
  );

  // All pickable fields. Stays inclusive of already-filtered fields
  // so multi-select rows don't vanish from the picker after the user
  // picks their first value (the previous behaviour: filter applied
  // → field excluded → row unmounts → submenu unmounts, perceived
  // as "the dropdown closed"). Existing filters are updated in
  // place by addFilterWithOption.
  const selectableFields = useMemo(() => {
    const flatFields = flattenFields(fields);
    return flatFields.filter(
      (field) => field.key && field.type !== "separator"
    );
  }, [fields]);

  // Fetch the current values for a field key — used by FieldRow to
  // hydrate its submenu's option-list selected state from the
  // already-persisted filters array.
  const getValuesForField = useCallback(
    (key: string): FilterOption<T>[] => {
      const existing = filters.find((f) => f.field === key);
      return (existing?.values as FilterOption<T>[]) ?? [];
    },
    [filters]
  );

  // Per-field keyboard shortcut map. Picks a single letter from each
  // field's label (Linear-style); falls back to digits 1-9, 0 when
  // every letter in a label is already claimed. Recomputed when the
  // selectable set changes (e.g., visibility / addition of fields).
  const fieldShortcuts = useMemo(
    () => assignFieldShortcuts(selectableFields),
    [selectableFields]
  );
  const shortcutToField = useMemo(() => {
    const map = new Map<string, string>();
    for (const [fieldKey, shortcut] of fieldShortcuts) {
      map.set(shortcut, fieldKey);
    }
    return map;
  }, [fieldShortcuts]);

  // Letter / digit picker shortcuts route through TanStack Hotkeys
  // (document-level listener, no element-focus dependency). The previous
  // implementation hung a React onKeyDown on the CommandInput, which
  // worked on Windows but missed events on Mac in some focus states.
  // Switching to a document-level handler eliminates the focus
  // dependency and lines up with how the rest of the app uses
  // @tanstack/hotkeys.
  //
  // Active only while the picker is open, no submenu has taken over,
  // and the search input is empty — once the user starts typing into
  // search, letters route to the search input as usual.
  const pickerLettersEnabled =
    addFilterOpen && !openSubKey && pickerSearch.length === 0;

  const handlePickerLetter = useCallback(
    (event: KeyboardEvent) => {
      const ch = event.key.toLowerCase();
      const fieldKey = shortcutToField.get(ch);
      if (!fieldKey) {
        return;
      }
      const field = fieldsMap[fieldKey];
      if (!field) {
        return;
      }
      if (field.type === "boolean" || field.type === "numberrange") {
        addFilterImmediate(field);
        return;
      }
      openSubImmediate(fieldKey);
    },
    [addFilterImmediate, fieldsMap, openSubImmediate, shortcutToField]
  );

  // ─── Submenu hotkeys ─────────────────────────────────────────────
  //
  // Esc closes the open submenu; Alt+1..9 picks the Nth option in
  // the open submenu's static option list. Both go through TanStack
  // Hotkeys (document-level, no element-focus dependency). The async
  // submenu intentionally skips Alt+N — see AsyncOptionsPopover.
  //
  // The dispatcher registry context is kept for compatibility with
  // any future surface that wants to register a custom handler; no
  // one registers today, so async-dispatch outcomes find no handler
  // and are silently ignored.
  const asyncDispatchersRef = useRef<Map<string, AsyncDispatcher>>(
    new Map()
  );
  const keyboardContextValue = useMemo<FilterKeyboardContextValue>(
    () => ({
      registerAsyncDispatcher: (fieldKey, handler) => {
        asyncDispatchersRef.current.set(fieldKey, handler);
        return () => {
          asyncDispatchersRef.current.delete(fieldKey);
        };
      },
    }),
    []
  );

  useHotkey(
    "Escape",
    () => {
      closeSubImmediate();
      // Restore focus to the picker's search input — Radix would
      // otherwise return focus to the submenu's trigger
      // (FieldRow's CommandItem), leaving the next letter shortcut
      // firing on a non-handled element. Defer one frame so the DOM
      // has settled after the submenu unmount before we steal focus.
      requestAnimationFrame(() => {
        const pickers = document.querySelectorAll<HTMLElement>(
          "[data-filter-picker]"
        );
        for (const picker of pickers) {
          const input = picker.querySelector<HTMLInputElement>(
            '[data-slot="command-input"]'
          );
          if (input) {
            input.focus();
            break;
          }
        }
      });
    },
    {
      enabled: addFilterOpen && openSubKey !== null,
      preventDefault: true,
    }
  );

  const handleSubmenuDigit = useCallback(
    (event: KeyboardEvent) => {
      if (!openSubKey) {
        return;
      }
      // event.code is the physical key ("Digit1"..."Digit9") and is
      // unaffected by Mac Option-character substitution; event.key
      // becomes "¡"/"™"/etc. when Option is held. Prefer code.
      let digit: number | null = null;
      if (event.code && /^Digit[1-9]$/.test(event.code)) {
        digit = Number(event.code.slice(5));
      } else if (event.key >= "1" && event.key <= "9") {
        digit = Number(event.key);
      }
      if (digit === null) {
        return;
      }
      const field = fieldsMap[openSubKey];
      if (!field) {
        return;
      }
      const index = digit - 1;
      if (field.async) {
        const dispatch = asyncDispatchersRef.current.get(openSubKey);
        dispatch?.(index);
        return;
      }
      const picked = field.options?.[index];
      if (!picked) {
        return;
      }
      const existing = filters.find((f) => f.field === openSubKey);
      const current = existing?.values ?? [];
      const values = computeNextValues(field, current, picked);
      // closePopover=false: Alt+N is a rapid-pick affordance. Single-
      // select replaces in place, multi-select toggles, both keep
      // the popover open until the user explicitly dismisses it.
      addFilterWithOption(field, values, false);
    },
    [addFilterWithOption, fieldsMap, filters, openSubKey]
  );

  // useHotkey only accepts a single RegisterableHotkey per call, so each
  // shortcut needs its own registration. We render a fixed set of
  // <PickerHotkey> nodes — one per letter/digit for the field picker,
  // one per Alt+digit for the submenu — keeping the hook count stable
  // across renders. Picker letters are enabled only while the picker is
  // open and the search is empty; Alt+digit only while a submenu is
  // open.
  const submenuOpen = addFilterOpen && openSubKey !== null;

  return (
    <FilterContext.Provider
      value={{
        size,
        i18n: mergedI18n,
        className,
        showAddButton,
        addButtonText,
        addButtonIcon,
        addButtonClassName,
        addButton,
        showSearchInput,
        trigger,
      }}
    >
      <FilterKeyboardContext.Provider value={keyboardContextValue}>
      {/* One PickerHotkey per registered key. The hook count is stable */}
      {/* across renders (PICKER_LETTER_KEYS and SUBMENU_ALT_DIGIT_KEYS */}
      {/* are constant), and each individual binding flips on/off via */}
      {/* the `enabled` prop. */}
      {PICKER_LETTER_KEYS.map((key) => (
        <PickerHotkey
          enabled={pickerLettersEnabled}
          hotkey={key}
          key={key}
          onTrigger={handlePickerLetter}
        />
      ))}
      {SUBMENU_ALT_DIGIT_KEYS.map((key) => (
        <PickerHotkey
          enabled={submenuOpen}
          hotkey={key}
          key={key}
          onTrigger={handleSubmenuDigit}
        />
      ))}
      <div className={cn("flex flex-wrap items-center gap-2", className)}>
        {filters.map((filter) => {
          const field = fieldsMap[filter.field];
          if (!field) {
            return null;
          }

          return (
            <ButtonGroup className="shrink-0" data-slot="filter-item" key={filter.id}>
              <ButtonGroupText className="whitespace-nowrap">
                {field.icon}
                {field.label}
              </ButtonGroupText>

              <FilterOperatorDropdown<T>
                field={field}
                onChange={(operator) => updateFilter(filter.id, { operator })}
                operator={filter.operator}
                values={filter.values}
              />

              <FilterValueSelector<T>
                field={field}
                onChange={(values) => updateFilter(filter.id, { values })}
                onRemove={() => removeFilter(filter.id)}
                operator={filter.operator}
                values={filter.values}
              />

              <FilterRemoveButton onClick={() => removeFilter(filter.id)} />
            </ButtonGroup>
          );
        })}
        {showAddButton && selectableFields.length > 0 ? (
          <Popover
            // Dropped `modal` deliberately: the per-row submenus are
            // nested Popovers rendered into separate portals. With
            // modal on, Radix's DismissableLayer treats clicks in a
            // child portal as "outside" the parent and closes it,
            // which manifested as "the picker closes after one pick"
            // when the user clicked a multi-select option in the
            // submenu. Non-modal + the onInteractOutside guard below
            // keep the parent open while the submenu owns the click.
            onOpenChange={(open) => {
              setAddFilterOpen(open);
              if (open) {
                // Fresh search each open so the shortcut handler is
                // immediately armed (empty-search precondition).
                setPickerSearch("");
              } else {
                clearTimers();
                setOpenSubKey(null);
                setPickerSearch("");
              }
            }}
            open={addFilterOpen}
          >
            <PopoverTrigger asChild>
              {addButton ? (
                addButton
              ) : (
                <Button
                  className={addButtonClassName}
                  size={filters.length > 0 ? pickIconSize(size) : size}
                  title={mergedI18n.addFilterTitle}
                  type="button"
                  variant="outline"
                >
                  {addButtonIcon ||
                    (filters.length > 0 ? <ListFilterPlus /> : <ListFilter />)}
                  {filters.length === 0
                    ? addButtonText || mergedI18n.addFilter
                    : null}
                </Button>
              )}
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className={cn("w-[240px] p-0", popoverContentClassName)}
              // Marker used by the document-level keyboard coordinator
              // (above) to scope its Esc + Alt+N handling to this
              // picker, not to arbitrary Radix popovers elsewhere on
              // the page that share `data-slot='popover-content'`.
              data-filter-picker=""
              // Submenu Popovers render into their own portals; a
              // click inside the submenu is "outside" the parent's
              // content DOM and would otherwise dismiss the parent.
              // Guard by checking whether the event target lives
              // inside any popover content (ours or the submenu's)
              // and cancelling the dismiss when so.
              onInteractOutside={(e) => {
                const target = e.target as Element | null;
                if (target?.closest?.("[data-slot='popover-content']")) {
                  e.preventDefault();
                }
              }}
            >
              {/* Single-column field list. Each row owns its own
                  Popover (FieldRow) that opens to the right on
                  hover/click. Only one is open at a time via
                  `openSubKey`. The outer Command gives us search +
                  keyboard nav for free. */}
              {(() => {
                const renderRow = (field: FilterFieldConfig<T>) => {
                  const isImmediate =
                    field.type === "boolean" || field.type === "numberrange";
                  return (
                    <FieldRow<T>
                      field={field}
                      isImmediate={isImmediate}
                      isOpen={openSubKey === field.key}
                      key={field.key}
                      onChange={(values) => {
                        const closeAfter = field.type === "select";
                        addFilterWithOption(field, values, closeAfter);
                      }}
                      onClick={() => {
                        if (isImmediate) {
                          addFilterImmediate(field);
                          return;
                        }
                        if (field.key) {
                          openSubImmediate(field.key);
                        }
                      }}
                      onCloseAll={closeAll}
                      onCloseSubmenu={closeSubImmediate}
                      onCommit={(values) =>
                        addFilterWithOption(field, values, true)
                      }
                      onHoverClose={requestCloseSub}
                      onHoverOpen={requestOpenSub}
                      shortcut={fieldShortcuts.get(field.key as string)}
                      values={getValuesForField(field.key as string)}
                    />
                  );
                };

                return (
                  <Command className="bg-transparent" shouldFilter>
                    {showSearchInput ? (
                      // No onKeyDown — letter / digit picker shortcuts
                      // are owned by the useHotkey registration above,
                      // gated on `pickerSearch.length === 0` so the
                      // input still handles typing as soon as the user
                      // starts a search.
                      <CommandInput
                        onValueChange={setPickerSearch}
                        placeholder={mergedI18n.searchFields}
                        value={pickerSearch}
                      />
                    ) : null}
                    <CommandList className="max-h-[320px]">
                      <CommandEmpty>{mergedI18n.noFieldsFound}</CommandEmpty>
                      {fields.map((item, index) => {
                        if (isFieldGroup(item)) {
                          // Keep already-filtered fields visible so
                          // multi-select rows don't vanish after the
                          // first pick. Separators always render.
                          const groupFields = item.fields;
                          if (groupFields.length === 0) {
                            return null;
                          }
                          return (
                            <CommandGroup
                              heading={item.group || "Fields"}
                              key={`group-${index}`}
                            >
                              {groupFields.map((field, fieldIndex) => {
                                if (field.type === "separator") {
                                  return (
                                    <CommandSeparator
                                      key={`separator-${fieldIndex}`}
                                    />
                                  );
                                }
                                return renderRow(field);
                              })}
                            </CommandGroup>
                          );
                        }

                        if (isGroupLevelField(item)) {
                          // Keep already-filtered fields visible so
                          // multi-select rows don't vanish after the
                          // first pick. Separators always render.
                          const groupFields = item.fields!;
                          if (groupFields.length === 0) {
                            return null;
                          }
                          return (
                            <CommandGroup
                              heading={item.group || "Fields"}
                              key={`group-${index}`}
                            >
                              {groupFields.map((field, fieldIndex) => {
                                if (field.type === "separator") {
                                  return (
                                    <CommandSeparator
                                      key={`separator-${fieldIndex}`}
                                    />
                                  );
                                }
                                return renderRow(field);
                              })}
                            </CommandGroup>
                          );
                        }

                        return null;
                      })}

                      {(() => {
                        // Top-level (ungrouped) fields. Keep them all
                        // visible whether or not they already have a
                        // filter applied — see comment above on
                        // groupFields. Separators stay where they are.
                        const flatItems = fields.filter((item) => {
                          if (isFieldGroup(item) || isGroupLevelField(item)) {
                            return false;
                          }
                          return true;
                        }) as FilterFieldConfig<T>[];

                        if (flatItems.length === 0) {
                          return null;
                        }

                        return (
                          <CommandGroup>
                            {flatItems.map((field) => {
                              if (field.type === "separator") {
                                return (
                                  <CommandSeparator
                                    key={`separator-${field.key}`}
                                  />
                                );
                              }
                              return renderRow(field);
                            })}
                          </CommandGroup>
                        );
                      })()}
                    </CommandList>
                    {/* The per-row Kbd badges (`⌥ + 1..9`) serve as
                        the affordance themselves — no footer copy
                        needed. The picker's letter shortcuts are
                        discoverable via the badges on each row. */}
                  </Command>
                );
              })()}
            </PopoverContent>
          </Popover>
        ) : null}
      </div>
      </FilterKeyboardContext.Provider>
    </FilterContext.Provider>
  );
}
