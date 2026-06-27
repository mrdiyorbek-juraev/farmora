"use client";

import {
  Editable,
  EditableArea,
  EditableInput,
  EditablePreview,
} from "@repo/design-system/components/composed/editable";
import { TruncatedText } from "@repo/design-system/components/composed/truncated-text";
import { cn } from "@repo/design-system/lib/utils";

import type { EditableTextRowProps } from "@/types/main/herd-detail";

export function EditableTextRow({
  icon,
  label,
  value,
  placeholder,
  maxLength,
  tabular,
  className,
  onSave,
}: EditableTextRowProps) {
  const handleSubmit = (next: string) => {
    const trimmed = next.trim();
    // Skip the round trip if nothing changed — common case when the user
    // clicks the cell, doesn't type, and blurs away.
    if (trimmed === value.trim()) {
      return;
    }
    void onSave(trimmed);
  };

  return (
    <div className="grid grid-cols-[120px_1fr] items-center gap-3 py-1.5">
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <div className="min-w-0 text-sm">
        <Editable
          autosize={false}
          defaultValue={value}
          maxLength={maxLength}
          onSubmit={handleSubmit}
          placeholder={placeholder}
        >
          <EditableArea className="w-full">
            {/* Preview is intentionally flat — no border, no bg, no shadow */}
            {/* — so the panel reads like static text. Border + bg switch */}
            {/* on only once the user clicks in and the input takes over. */}
            {/* `border-0 bg-transparent shadow-none` beats the design-system */}
            {/* defaults (`border border-transparent`, `shadow-xs`) so we */}
            {/* don't ship a phantom 1px line in dark mode. */}
            <EditablePreview
              className={cn(
                "block w-full truncate border-0 bg-transparent px-1.5 text-sm shadow-none",
                tabular && "font-medium tabular-nums",
                className
              )}
            >
              {value || placeholder || "—"}
            </EditablePreview>
            <EditableInput
              className={cn(
                "h-7 rounded-sm border border-input bg-background px-1.5 text-sm shadow-none",
                tabular && "font-medium tabular-nums"
              )}
            />
          </EditableArea>
        </Editable>
      </div>
    </div>
  );
}

/**
 * Read-only variant of the row — keeps the same layout/typography but
 * never enters edit mode. Useful for fields like "Last updated" that
 * the user shouldn't touch.
 */
export function ReadOnlyTextRow({
  icon,
  label,
  value,
  tabular,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tabular?: boolean;
}) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-center gap-3 py-1.5">
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <div className="min-w-0 text-sm">
        {typeof value === "string" ? (
          <TruncatedText
            className={cn(
              "block px-1.5",
              tabular && "font-medium tabular-nums"
            )}
            text={value}
          />
        ) : (
          <div className="px-1.5">{value}</div>
        )}
      </div>
    </div>
  );
}
