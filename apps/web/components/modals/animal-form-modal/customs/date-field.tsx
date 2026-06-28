"use client";

import { FastField, type FastFieldProps } from "formik";

import { DatePicker } from "./date-picker";
import { FormRow } from "./form-row";

interface DateFieldProps {
  disableFuture?: boolean;
  label: string;
  name: string;
  placeholder?: string;
}

// Formik-bound date picker wrapped in the standard FormRow.
export function DateField({
  name,
  label,
  placeholder,
  disableFuture,
}: DateFieldProps) {
  return (
    <FastField name={name}>
      {({ field, meta, form }: FastFieldProps<string>) => (
        <FormRow
          error={meta.touched ? meta.error : undefined}
          htmlFor={name}
          label={label}
        >
          <DatePicker
            disableFuture={disableFuture}
            id={name}
            invalid={Boolean(meta.touched && meta.error)}
            onChange={(next) => {
              form.setFieldValue(name, next);
              form.setFieldTouched(name, true, false);
            }}
            placeholder={placeholder}
            value={field.value}
          />
        </FormRow>
      )}
    </FastField>
  );
}
