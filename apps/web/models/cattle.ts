import { z } from "zod";

const statusEnum = z.enum(["active", "sick", "pregnant", "sold", "deceased"]);

const genderEnum = z.enum(["female", "male"]);

const breedEnum = z.enum([
  "holstein",
  "jersey",
  "angus",
  "hereford",
  "brown_swiss",
  "guernsey",
  "charolais",
  "simmental",
  "other",
]);

const acquisitionEnum = z.enum(["born_on_farm", "purchased"]);

export type Status = z.infer<typeof statusEnum>;
export type Gender = z.infer<typeof genderEnum>;
export type Breed = z.infer<typeof breedEnum>;
export type Acquisition = z.infer<typeof acquisitionEnum>;

const cattleSchema = z.object({
  id: z.uuid(),
  organization_id: z.uuid(),
  created_by_user_id: z.string(),
  tag_number: z.string().min(1),
  name: z.string().nullable(),
  breed: breedEnum,
  gender: genderEnum,
  date_of_birth: z.string(),
  status: statusEnum,
  weight_kg: z.number().nullable(),
  acquisition: acquisitionEnum,
  acquired_date: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

const statusHistorySchema = z.object({
  id: z.uuid(),
  cattle_id: z.uuid(),
  changed_by_user_id: z.string().nullable(),
  from_status: statusEnum.nullable(),
  to_status: statusEnum,
  changed_at: z.string(),
  note: z.string().nullable(),
});

const cattleWithHistorySchema = cattleSchema.extend({
  status_history: z.array(statusHistorySchema),
});

const cattleSortColumnEnum = z.enum([
  "created_at",
  "tag_number",
  "name",
  "date_of_birth",
  "weight_kg",
  "status",
  "breed",
]);

const sortDirectionEnum = z.enum(["asc", "desc"]);

export const listCattleFiltersSchema = z.object({
  status: statusEnum.optional(),
  breed: breedEnum.optional(),
  gender: genderEnum.optional(),
  search: z.string().trim().min(1).max(200).optional(),
  sort: cattleSortColumnEnum.optional(),
  direction: sortDirectionEnum.optional(),
  limit: z.number().int().positive().max(200).default(50),
  offset: z.number().int().nonnegative().default(0),
});

export type CattleSortColumn = z.infer<typeof cattleSortColumnEnum>;
export type SortDirection = z.infer<typeof sortDirectionEnum>;

export const getCattleByIdInputSchema = z.object({
  id: z.uuid(),
});

export const createCattleInputSchema = z.object({
  tag_number: z.string().trim().min(1).max(64),
  name: z.string().trim().max(120).optional().nullable(),
  breed: breedEnum,
  gender: genderEnum,
  date_of_birth: z.iso.date(),
  status: statusEnum.optional(),
  weight_kg: z.number().positive().max(9999.99).optional().nullable(),
  acquisition: acquisitionEnum,
  acquired_date: z.iso.date().optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const updateCattleInputSchema = createCattleInputSchema
  .partial()
  .extend({
    id: z.uuid(),
  });

export const deleteCattleInputSchema = z.object({
  id: z.uuid(),
});

// Bulk delete cap matches the list page size — keeps the
// `id in (...)` payload bounded and lets us reject obviously bad
// callers before they hit the DB.
export const deleteManyCattleInputSchema = z.object({
  ids: z.array(z.uuid()).min(1).max(200),
});

export const checkTagAvailableInputSchema = z.object({
  tag_number: z.string().trim().min(1).max(64),
  // Edit-mode caller passes its own cattle id so the lookup ignores self.
  exclude_id: z.uuid().optional(),
});

// ─── Cattle create form ────────────────────────────────────────────
//
// The form mirrors CreateCattleInput, but every field starts as a string
// (Formik `initialValues` must be JSON-serialisable, and shadcn inputs
// expect string `value` props). Required selects use "" as the empty
// sentinel, so the trigger renders its placeholder until the user picks.
//
// We validate the FORM shape on every change/blur (cheap, error keys
// match field names so messages render under the right input), then run
// `cattleFormToCreateInput()` on submit to produce a typed
// `CreateCattleInput` that the server action accepts.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const WEIGHT_MAX = 9999.99;
// Allow integers and decimals with up to 2 fractional digits.
// Rejects leading `.5`, negatives, exponents, thousand separators.
const WEIGHT_NUMERIC = /^\d+(?:\.\d{1,2})?$/;

const optionalDate = z.string().refine((v) => v === "" || ISO_DATE.test(v), {
  message: "Use the date picker (YYYY-MM-DD).",
});

const requiredDate = z
  .string()
  .min(1, "Date of birth is required")
  .refine((v) => ISO_DATE.test(v), {
    message: "Use the date picker (YYYY-MM-DD).",
  });

const weightField = z
  .string()
  .refine((v) => v === "" || WEIGHT_NUMERIC.test(v), {
    message: "Weight must be a positive number with up to 2 decimals.",
  })
  .refine((v) => v === "" || Number(v) > 0, {
    message: "Weight must be greater than 0.",
  })
  .refine((v) => v === "" || Number(v) <= WEIGHT_MAX, {
    message: `Weight cannot exceed ${WEIGHT_MAX} kg.`,
  });

export const cattleFormSchema = z.object({
  tag_number: z
    .string()
    .trim()
    .min(1, "Tag is required")
    .max(64, "Tag must be 64 characters or fewer."),
  name: z.string().trim().max(120, "Name must be 120 characters or fewer."),
  breed: z.string().min(1, "Breed is required").pipe(breedEnum),
  gender: z.string().min(1, "Gender is required").pipe(genderEnum),
  date_of_birth: requiredDate,
  // Empty string keeps the form happy; transformer falls back to
  // "active" before talking to the BE.
  status: z.union([z.literal(""), statusEnum]),
  weight_kg: weightField,
  acquisition: z
    .string()
    .min(1, "Acquisition is required")
    .pipe(acquisitionEnum),
  acquired_date: optionalDate,
  notes: z.string().trim().max(2000, "Notes must be 2000 characters or fewer."),
});

export type CattleFormValues = z.input<typeof cattleFormSchema>;

export const cattleFormInitialValues: CattleFormValues = {
  tag_number: "",
  name: "",
  breed: "",
  gender: "",
  date_of_birth: "",
  status: "active",
  weight_kg: "",
  acquisition: "",
  acquired_date: "",
  notes: "",
};

/**
 * Convert validated form values into the BE create input. Call only
 * after `cattleFormSchema.parse()` has succeeded — empty strings on
 * optional fields become `null`, `weight_kg` becomes a number.
 */
/**
 * Convert a persisted cattle row back into the form-values shape so the
 * "Edit animal" modal can pre-fill every field. `null` columns become
 * empty strings (the form's neutral sentinel) and numeric weight is
 * stringified — matches `cattleFormInitialValues`.
 */
export function cattleToFormValues(row: CattleRow): CattleFormValues {
  return {
    tag_number: row.tag_number,
    name: row.name ?? "",
    breed: row.breed,
    gender: row.gender,
    date_of_birth: row.date_of_birth,
    status: row.status,
    weight_kg: row.weight_kg == null ? "" : String(row.weight_kg),
    acquisition: row.acquisition,
    acquired_date: row.acquired_date ?? "",
    notes: row.notes ?? "",
  };
}

export function cattleFormToCreateInput(
  values: z.infer<typeof cattleFormSchema>
): CreateCattleInput {
  // Schema already trims string fields, but be belt-and-braces when
  // turning empties into nulls — saves a NULL row in DB for
  // whitespace-only notes etc.
  const name = values.name.trim();
  const notes = values.notes.trim();
  return {
    tag_number: values.tag_number,
    name: name === "" ? null : name,
    breed: values.breed,
    gender: values.gender,
    date_of_birth: values.date_of_birth,
    status: values.status === "" ? "active" : values.status,
    weight_kg: values.weight_kg === "" ? null : Number(values.weight_kg),
    acquisition: values.acquisition,
    acquired_date: values.acquired_date === "" ? null : values.acquired_date,
    notes: notes === "" ? null : notes,
  };
}

export type CattleRow = z.infer<typeof cattleSchema>;
export type StatusHistoryRow = z.infer<typeof statusHistorySchema>;
export type CattleWithHistory = z.infer<typeof cattleWithHistorySchema>;
export type ListCattleFilters = z.input<typeof listCattleFiltersSchema>;
export type GetCattleByIdInput = z.infer<typeof getCattleByIdInputSchema>;
export type CreateCattleInput = z.infer<typeof createCattleInputSchema>;
export type UpdateCattleInput = z.infer<typeof updateCattleInputSchema>;
export type DeleteCattleInput = z.infer<typeof deleteCattleInputSchema>;
export type DeleteManyCattleInput = z.infer<typeof deleteManyCattleInputSchema>;
export type CheckTagAvailableInput = z.input<
  typeof checkTagAvailableInputSchema
>;
