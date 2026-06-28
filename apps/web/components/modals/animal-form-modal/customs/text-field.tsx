"use client";

import { Input } from "@repo/design-system/components/ui/input";
import { FastField, type FastFieldProps } from "formik";
import type { HTMLInputTypeAttribute } from "react";

import { FormRow } from "./form-row";

interface TextFieldProps {
  autoComplete?: string;
  description?: string;
  inputMode?: "text" | "decimal" | "numeric";
  label: string;
  name: string;
  placeholder?: string;
  type?: HTMLInputTypeAttribute;
}

// Formik-bound single-line text input wrapped in the standard FormRow.
export function TextField({
  name,
  label,
  placeholder,
  description,
  type = "text",
  inputMode,
  autoComplete,
}: TextFieldProps) {
  return (
    <FastField name={name}>
      {({ field, meta }: FastFieldProps<string>) => (
        <FormRow
          description={description}
          error={meta.touched ? meta.error : undefined}
          htmlFor={name}
          label={label}
        >
          <Input
            {...field}
            aria-invalid={Boolean(meta.touched && meta.error)}
            autoComplete={autoComplete}
            id={name}
            inputMode={inputMode}
            placeholder={placeholder}
            type={type}
          />
        </FormRow>
      )}
    </FastField>
  );
}
