"use client";

import { Textarea } from "@repo/design-system/components/ui/textarea";
import { FastField, type FastFieldProps } from "formik";

import { FormRow } from "./form-row";

interface TextareaFieldProps {
  description?: string;
  label: string;
  name: string;
  placeholder?: string;
  rows?: number;
}

// Formik-bound multi-line text input wrapped in the standard FormRow.
export function TextareaField({
  name,
  label,
  placeholder,
  description,
  rows = 3,
}: TextareaFieldProps) {
  return (
    <FastField name={name}>
      {({ field }: FastFieldProps<string>) => (
        <FormRow description={description} htmlFor={name} label={label}>
          <Textarea
            {...field}
            id={name}
            placeholder={placeholder}
            rows={rows}
          />
        </FormRow>
      )}
    </FastField>
  );
}
