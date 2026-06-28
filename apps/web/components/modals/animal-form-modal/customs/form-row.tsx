import { Label } from "@repo/design-system/components/ui/label";
import type { ReactNode } from "react";

interface FormRowProps {
  children: ReactNode;
  description?: string;
  error?: string;
  htmlFor: string;
  label: string;
}

// Lightweight label + control + error/description layout. Replaces the
// design-system `<Field>` so each field can drive the markup from its
// FastField render prop without nesting label state in a heavier wrapper.
export function FormRow({
  htmlFor,
  label,
  description,
  error,
  children,
}: FormRowProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="font-normal text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
      {description && !error ? (
        <p className="text-muted-foreground text-sm">{description}</p>
      ) : null}
    </div>
  );
}
