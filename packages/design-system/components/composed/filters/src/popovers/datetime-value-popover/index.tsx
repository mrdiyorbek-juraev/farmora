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

interface DateTimeValuePopoverProps<T = unknown> {
  children?: React.ReactNode;
  field: FilterFieldConfig<T>;
  onChange: (values: FilterOption<T>[]) => void;
  onRemove: () => void;
  operator: string;
  values: FilterOption<T>[];
}

function DateTimeValueEditor<T = unknown>({
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
  const currentStart = (values[0]?.value as string) || "";
  const currentEnd = (values[1]?.value as string) || "";

  const [draftStart, setDraftStart] = useState(currentStart);
  const [draftEnd, setDraftEnd] = useState(currentEnd);
  const startRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    startRef.current?.focus();
  }, []);

  const commit = () => {
    if (isBetween) {
      if (!(draftStart && draftEnd)) {
        onRemove();
        onClose();
        return;
      }
      onChange([
        { value: draftStart as T, label: draftStart },
        { value: draftEnd as T, label: draftEnd },
      ]);
      onClose();
      return;
    }

    if (!draftStart) {
      onRemove();
      onClose();
      return;
    }
    onChange([{ value: draftStart as T, label: draftStart }]);
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
    <div className="flex w-fit flex-col gap-2">
      {isBetween ? (
        <div className="flex items-center gap-2">
          <Input
            className="w-44"
            onChange={(e) => setDraftStart(e.target.value)}
            onKeyDown={handleKeyDown}
            ref={startRef}
            type="datetime-local"
            value={draftStart}
          />
          <span className="shrink-0 text-muted-foreground text-xs">
            {context.i18n.to}
          </span>
          <Input
            className="w-44"
            onChange={(e) => setDraftEnd(e.target.value)}
            onKeyDown={handleKeyDown}
            type="datetime-local"
            value={draftEnd}
          />
        </div>
      ) : (
        <Input
          className="w-56"
          onChange={(e) => setDraftStart(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={field.placeholder}
          ref={startRef}
          type="datetime-local"
          value={draftStart}
        />
      )}
    </div>
  );
}

function DateTimeValuePopover<T = unknown>({
  children,
  field,
  values,
  onChange,
  onRemove,
  operator,
}: DateTimeValuePopoverProps<T>) {
  const [open, setOpen] = useState(false);

  if (!children) {
    return (
      <DateTimeValueEditor
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
        <DateTimeValueEditor
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

export { DateTimeValuePopover };
