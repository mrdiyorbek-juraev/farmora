"use client";

import { Input } from "@repo/design-system/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/design-system/components/ui/popover";
import { useEffect, useRef, useState } from "react";
import { useFilterContext } from "../../context";
import type { FilterFieldConfig, FilterOption } from "../../types";

interface NumberValuePopoverProps<T = unknown> {
  children?: React.ReactNode;
  field: FilterFieldConfig<T>;
  onChange: (values: FilterOption<T>[]) => void;
  onRemove: () => void;
  operator: string;
  values: FilterOption<T>[];
}

function NumberValueEditor<T = unknown>({
  field,
  values,
  onChange,
  onRemove,
  operator,
  onClose,
}: {
  field: FilterFieldConfig<T>;
  values: FilterOption<T>[];
  onChange: (values: FilterOption<T>[]) => void;
  onRemove: () => void;
  operator: string;
  onClose: () => void;
}) {
  const context = useFilterContext();
  const isBetween = operator === "between" || operator === "not_between";

  // When the underlying column stores a different unit than the UI
  // displays (e.g. cents on the wire, dollars in the input), divide
  // on read so the user sees their unit, multiply on commit so the
  // BE gets the storage unit. Default 1 = passthrough.
  const wireMultiplier =
    field.wireMultiplier && field.wireMultiplier > 0 ? field.wireMultiplier : 1;

  const toDisplay = (raw: string | number | undefined): string => {
    if (raw === undefined || raw === "") {
      return "";
    }
    if (wireMultiplier === 1) {
      return String(raw);
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      return "";
    }
    return String(n / wireMultiplier);
  };

  const toWire = (display: string): string => {
    if (wireMultiplier === 1) {
      return display;
    }
    const n = Number(display);
    if (!Number.isFinite(n)) {
      return display;
    }
    // Round to avoid float drift on the integer-unit domains where
    // this is actually used (cents). 50 * 100 stays 5000.
    return String(Math.round(n * wireMultiplier));
  };

  const [draftMin, setDraftMin] = useState(
    toDisplay(values[0]?.value as string | number | undefined)
  );
  const [draftMax, setDraftMax] = useState(
    toDisplay(values[1]?.value as string | number | undefined)
  );
  const minRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    minRef.current?.focus();
    minRef.current?.select();
  }, []);

  const commit = () => {
    if (isBetween) {
      const minTrimmed = draftMin.trim();
      const maxTrimmed = draftMax.trim();
      if (!(minTrimmed && maxTrimmed)) {
        onRemove();
        onClose();
        return;
      }
      const minWire = toWire(minTrimmed);
      const maxWire = toWire(maxTrimmed);
      onChange([
        { value: minWire as T, label: minTrimmed },
        { value: maxWire as T, label: maxTrimmed },
      ]);
      onClose();
      return;
    }

    const trimmed = draftMin.trim();
    if (!trimmed) {
      onRemove();
      onClose();
      return;
    }
    const wire = toWire(trimmed);
    onChange([{ value: wire as T, label: trimmed }]);
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      onRemove();
      onClose();
    }
  };

  return (
    <div className="flex w-64 flex-col gap-2">
      {isBetween ? (
        <div className="flex items-center gap-2">
          <Input
            max={field.max}
            min={field.min}
            onChange={(e) => setDraftMin(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={context.i18n.min}
            ref={minRef}
            step={field.step}
            type="number"
            value={draftMin}
          />
          <span className="shrink-0 text-muted-foreground text-xs">
            {context.i18n.to}
          </span>
          <Input
            max={field.max}
            min={field.min}
            onChange={(e) => setDraftMax(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={context.i18n.max}
            step={field.step}
            type="number"
            value={draftMax}
          />
        </div>
      ) : (
        <Input
          max={field.max}
          min={field.min}
          onChange={(e) => setDraftMin(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            field.placeholder ||
            context.i18n.placeholders.enterField(
              field.label?.toLowerCase() || "value"
            )
          }
          ref={minRef}
          step={field.step}
          type="number"
          value={draftMin}
        />
      )}
    </div>
  );
}

function NumberValuePopover<T = unknown>({
  children,
  field,
  values,
  onChange,
  onRemove,
  operator,
}: NumberValuePopoverProps<T>) {
  const [open, setOpen] = useState(false);

  if (!children) {
    return (
      <NumberValueEditor
        field={field}
        onChange={onChange}
        onClose={() => {
          /* no-op when bare; caller controls lifecycle */
        }}
        onRemove={onRemove}
        operator={operator}
        values={values}
      />
    );
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="start" className="w-fit">
        <NumberValueEditor
          field={field}
          onChange={onChange}
          onClose={() => setOpen(false)}
          onRemove={onRemove}
          operator={operator}
          values={values}
        />
      </PopoverContent>
    </Popover>
  );
}

export { NumberValuePopover };
