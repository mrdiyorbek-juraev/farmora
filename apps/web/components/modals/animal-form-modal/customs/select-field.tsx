"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { FastField, type FastFieldProps } from "formik";

import type { SelectOption } from "../types";
import { FormRow } from "./form-row";

interface SelectFieldProps {
  label: string;
  name: string;
  options: SelectOption[];
  placeholder: string;
}

// Formik-bound select wrapped in the standard FormRow. Marks the field
// touched on change so validation messages surface immediately.
export function SelectField({
  name,
  label,
  placeholder,
  options,
}: SelectFieldProps) {
  return (
    <FastField name={name}>
      {({ field, meta, form }: FastFieldProps<string>) => (
        <FormRow
          error={meta.touched ? meta.error : undefined}
          htmlFor={name}
          label={label}
        >
          <Select
            onValueChange={(value) => {
              form.setFieldValue(name, value);
              form.setFieldTouched(name, true, false);
            }}
            value={field.value}
          >
            <SelectTrigger
              aria-invalid={Boolean(meta.touched && meta.error)}
              id={name}
              style={{ width: "100%" }}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormRow>
      )}
    </FastField>
  );
}
