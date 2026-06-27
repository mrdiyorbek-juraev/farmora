import { z } from "zod";

// ─── Persisted row ──────────────────────────────────────────────────
//
// Mirrors the weight_measurements table one-to-one. Weight is stored in
// kilograms (matching cattle.weight_kg); the UI converts to pounds for
// display only.

export const weightMeasurementSchema = z.object({
  id: z.uuid(),
  organization_id: z.uuid(),
  cattle_id: z.uuid(),
  recorded_by_user_id: z.string().nullable(),
  weight_kg: z.number(),
  measured_at: z.string(),
  note: z.string().nullable(),
  created_at: z.string(),
});

// ─── Server-action inputs ───────────────────────────────────────────

export const recordWeightInputSchema = z.object({
  cattle_id: z.uuid(),
  weight_kg: z.number().positive().max(9999.99),
  measured_at: z.iso.date(),
  note: z.string().trim().max(2000).optional().nullable(),
});

export const listWeightHistoryInputSchema = z.object({
  cattle_id: z.uuid(),
});

export const deleteWeightInputSchema = z.object({
  id: z.uuid(),
});

// ─── Record-weight form ─────────────────────────────────────────────
//
// The modal owns the cattle_id (passed via props), so the form only
// captures the user-entered fields. Every field starts as a string —
// see models/cattle.ts for the rationale. `weightFormToRecordInput()`
// folds in the cattle_id and produces a typed RecordWeightInput.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const WEIGHT_MAX = 9999.99;
// Integers and decimals with up to 2 fractional digits. Rejects leading
// `.5`, negatives, exponents, thousand separators.
const WEIGHT_NUMERIC = /^\d+(?:\.\d{1,2})?$/;

const requiredWeightField = z
  .string()
  .min(1, "Weight is required")
  .refine((v) => WEIGHT_NUMERIC.test(v), {
    message: "Weight must be a positive number with up to 2 decimals.",
  })
  .refine((v) => Number(v) > 0, {
    message: "Weight must be greater than 0.",
  })
  .refine((v) => Number(v) <= WEIGHT_MAX, {
    message: `Weight cannot exceed ${WEIGHT_MAX} kg.`,
  });

const requiredDate = z
  .string()
  .min(1, "Date is required")
  .refine((v) => ISO_DATE.test(v), {
    message: "Use the date picker (YYYY-MM-DD).",
  });

export const weightFormSchema = z.object({
  weight_kg: requiredWeightField,
  measured_at: requiredDate,
  note: z.string().trim().max(2000, "Note must be 2000 characters or fewer."),
});

export type WeightFormValues = z.input<typeof weightFormSchema>;

export const weightFormInitialValues: WeightFormValues = {
  weight_kg: "",
  measured_at: "",
  note: "",
};

/**
 * Convert validated form values + the subject animal id into the BE
 * record input. Call only after `weightFormSchema.parse()` has
 * succeeded — an empty note becomes `null`.
 */
export function weightFormToRecordInput(
  cattleId: string,
  values: z.infer<typeof weightFormSchema>
): RecordWeightInput {
  const note = values.note.trim();
  return {
    cattle_id: cattleId,
    weight_kg: Number(values.weight_kg),
    measured_at: values.measured_at,
    note: note === "" ? null : note,
  };
}

// ─── Types ──────────────────────────────────────────────────────────

export type WeightMeasurementRow = z.infer<typeof weightMeasurementSchema>;

// Read shape returned to the tab: the persisted row plus the average
// daily gain since the previous (chronologically earlier) measurement.
// `null` on the oldest point, which has nothing to compare against.
export type WeightMeasurementWithGain = WeightMeasurementRow & {
  average_daily_gain_kg: number | null;
};

export type RecordWeightInput = z.infer<typeof recordWeightInputSchema>;
export type ListWeightHistoryInput = z.infer<
  typeof listWeightHistoryInputSchema
>;
export type DeleteWeightInput = z.infer<typeof deleteWeightInputSchema>;
