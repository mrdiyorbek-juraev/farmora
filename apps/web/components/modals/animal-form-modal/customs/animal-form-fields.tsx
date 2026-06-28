"use client";

import {
  ACQUISITION_OPTIONS,
  BREED_OPTIONS,
  GENDER_OPTIONS,
  STATUS_OPTIONS,
} from "@/constants/cattle";

import type { TagAvailability } from "../types";
import { DateField } from "./date-field";
import { SelectField } from "./select-field";
import { TagField } from "./tag-field";
import { TextField } from "./text-field";
import { TextareaField } from "./textarea-field";

interface AnimalFormFieldsProps {
  excludeId: string | undefined;
  isEdit: boolean;
  onAvailabilityChange: (state: TagAvailability) => void;
}

// The full field set for the animal form, composed from the reusable
// Formik field primitives. Layout only — all behavior lives in the fields
// and in `useAnimalForm`.
export function AnimalFormFields({
  excludeId,
  isEdit,
  onAvailabilityChange,
}: AnimalFormFieldsProps) {
  return (
    <div className="flex flex-col gap-5">
      <TagField
        excludeId={excludeId}
        onAvailabilityChange={onAvailabilityChange}
      />

      <TextField label="Name" name="name" placeholder="Bessie" />

      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        <SelectField
          label="Breed *"
          name="breed"
          options={BREED_OPTIONS}
          placeholder="Pick a breed"
        />
        <SelectField
          label="Gender *"
          name="gender"
          options={GENDER_OPTIONS}
          placeholder="Pick a gender"
        />
      </div>

      <DateField
        disableFuture
        label="Date of birth *"
        name="date_of_birth"
        placeholder="Pick birth date"
      />

      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        <SelectField
          label="Status"
          name="status"
          options={STATUS_OPTIONS}
          placeholder="Pick a status"
        />
        <SelectField
          label="Acquisition *"
          name="acquisition"
          options={ACQUISITION_OPTIONS}
          placeholder="How did you acquire it?"
        />
      </div>

      {/* Weight is only set at creation here — it seeds the first weigh-in. */}
      {/* After that, weight changes only through the Weight history tab, so */}
      {/* the field is hidden in edit mode. */}
      {isEdit ? null : (
        <TextField
          autoComplete="off"
          description="Optional — recorded as the first entry in the weight history."
          inputMode="decimal"
          label="Initial weight (kg)"
          name="weight_kg"
          placeholder="450"
        />
      )}

      <DateField
        disableFuture
        label="Acquired date"
        name="acquired_date"
        placeholder="Pick acquired date"
      />

      <TextareaField
        description="Optional — anything you'd want to see later in the herd detail view."
        label="Notes"
        name="notes"
        placeholder="Anything worth remembering…"
      />
    </div>
  );
}
