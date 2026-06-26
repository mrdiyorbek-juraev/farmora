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

const CONTACT_PATTERNS: Record<string, { type: string; pattern: string }> = {
  email: { type: "email", pattern: "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$" },
  url: {
    type: "url",
    pattern:
      "^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)$",
  },
  tel: { type: "tel", pattern: "^[\\+]?[1-9][\\d]{0,15}$" },
};

interface TextValuePopoverProps<T = unknown> {
  children?: React.ReactNode;
  field: FilterFieldConfig<T>;
  onChange: (values: FilterOption<T>[]) => void;
  onRemove: () => void;
  values: FilterOption<T>[];
}

function TextValueEditor<T = unknown>({
  field,
  values,
  onChange,
  onRemove,
  onClose,
}: {
  field: FilterFieldConfig<T>;
  values: FilterOption<T>[];
  onChange: (values: FilterOption<T>[]) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const context = useFilterContext();
  const currentValue = (values[0]?.value as string) || "";
  const [draft, setDraft] = useState(currentValue);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const fieldType = field.type ?? "text";
  const config = CONTACT_PATTERNS[fieldType] ?? {
    type: "text",
    pattern: undefined,
  };
  const inputType = config.type;
  const inputPattern = field.pattern || config.pattern;

  const validate = (value: string): string | null => {
    if (!value) {
      return null;
    }
    if (field.validation && !field.validation(value)) {
      return context.i18n.validation.invalid;
    }
    if (inputPattern) {
      const regex = new RegExp(inputPattern);
      if (!regex.test(value)) {
        if (fieldType === "email") {
          return context.i18n.validation.invalidEmail;
        }
        if (fieldType === "url") {
          return context.i18n.validation.invalidUrl;
        }
        if (fieldType === "tel") {
          return context.i18n.validation.invalidTel;
        }
        return context.i18n.validation.invalid;
      }
    }
    return null;
  };

  const commit = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      onRemove();
      onClose();
      return;
    }
    const validationError = validate(trimmed);
    if (validationError) {
      setError(validationError);
      return;
    }
    onChange([{ value: trimmed as T, label: trimmed }]);
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
      <Input
        aria-invalid={Boolean(error)}
        onChange={(e) => {
          setDraft(e.target.value);
          if (error) {
            setError(null);
          }
        }}
        onKeyDown={handleKeyDown}
        pattern={inputPattern}
        placeholder={
          field.placeholder || context.i18n.placeholders.enterField(fieldType)
        }
        ref={inputRef}
        type={inputType}
        value={draft}
      />
      {error ? (
        <p className="text-destructive text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function TextValuePopover<T = unknown>({
  children,
  field,
  values,
  onChange,
  onRemove,
}: TextValuePopoverProps<T>) {
  const [open, setOpen] = useState(false);

  // No trigger — render bare editor, caller wraps it.
  if (!children) {
    return (
      <TextValueEditor
        field={field}
        onChange={onChange}
        onClose={() => {
          /* no-op when bare; caller controls lifecycle */
        }}
        onRemove={onRemove}
        values={values}
      />
    );
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="start" className="w-fit">
        <TextValueEditor
          field={field}
          onChange={onChange}
          onClose={() => setOpen(false)}
          onRemove={onRemove}
          values={values}
        />
      </PopoverContent>
    </Popover>
  );
}

export { TextValuePopover };
