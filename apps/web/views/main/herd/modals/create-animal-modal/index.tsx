"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Calendar } from "@repo/design-system/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/design-system/components/ui/dialog";
import { Input } from "@repo/design-system/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@repo/design-system/components/ui/input-group";
import { Label } from "@repo/design-system/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/design-system/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { Switch } from "@repo/design-system/components/ui/switch";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import { cn } from "@repo/design-system/lib/utils";
import { format, parse } from "date-fns";
import {
  FastField,
  type FastFieldProps,
  Form,
  Formik,
  type FormikHelpers,
} from "formik";
import { CalendarIcon, Check, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import {
  checkCattleTagAvailableAction,
  generateCattleTagAction,
} from "@/app/_actions/cattle";
import { zodValidate } from "@/lib/forms/zod-validate";
import {
  type CattleFormValues,
  cattleFormInitialValues,
  cattleFormSchema,
  cattleFormToCreateInput,
  cattleToFormValues,
  type CreateCattleInput,
} from "@/models/cattle";
import { useCattleMutations } from "@/services/cattle/mutations";
import { useGlobalModal } from "@/stores/shared/modal-store";

type FormValues = CattleFormValues;

const initialValues = cattleFormInitialValues;
const validate = zodValidate(cattleFormSchema);

const breedOptions: { value: CreateCattleInput["breed"]; label: string }[] = [
  { value: "holstein", label: "Holstein" },
  { value: "jersey", label: "Jersey" },
  { value: "angus", label: "Angus" },
  { value: "hereford", label: "Hereford" },
  { value: "brown_swiss", label: "Brown Swiss" },
  { value: "guernsey", label: "Guernsey" },
  { value: "charolais", label: "Charolais" },
  { value: "simmental", label: "Simmental" },
  { value: "other", label: "Other" },
];

const genderOptions: { value: CreateCattleInput["gender"]; label: string }[] = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
];

const statusOptions: {
  value: NonNullable<CreateCattleInput["status"]>;
  label: string;
}[] = [
  { value: "active", label: "Active" },
  { value: "sick", label: "Sick" },
  { value: "pregnant", label: "Pregnant" },
  { value: "sold", label: "Sold" },
  { value: "deceased", label: "Deceased" },
];

const acquisitionOptions: {
  value: CreateCattleInput["acquisition"];
  label: string;
}[] = [
  { value: "born_on_farm", label: "Born on farm" },
  { value: "purchased", label: "Purchased" },
];

// Lightweight label + control + error/description layout. Replaces the
// design-system `<Field>` so we can drive the markup from each FastField
// render prop without nesting label state inside a heavier wrapper.
function FormRow({
  htmlFor,
  label,
  description,
  error,
  children,
}: {
  htmlFor: string;
  label: string;
  description?: string;
  error?: string;
  children: React.ReactNode;
}) {
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

const DATE_WIRE_FORMAT = "yyyy-MM-dd";

function parseDateValue(value: string | undefined): Date | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = parse(value, DATE_WIRE_FORMAT, new Date());
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

type DateFieldProps = {
  id: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  invalid?: boolean;
  disableFuture?: boolean;
};

function DateField({
  id,
  value,
  onChange,
  placeholder = "Pick a date",
  invalid,
  disableFuture,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const date = parseDateValue(value);

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-invalid={invalid}
          className={cn(
            "justify-start gap-2 px-3 font-normal",
            !date && "text-muted-foreground"
          )}
          id={id}
          style={{ width: "100%" }}
          type="button"
          variant="outline"
        >
          <CalendarIcon className="text-muted-foreground" />
          {date ? format(date, "PPP") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          captionLayout="dropdown"
          disabled={disableFuture ? { after: new Date() } : undefined}
          mode="single"
          onSelect={(next) => {
            if (next) {
              onChange(format(next, DATE_WIRE_FORMAT));
              setOpen(false);
            }
          }}
          selected={date}
        />
      </PopoverContent>
    </Popover>
  );
}

type TagAvailability = "idle" | "checking" | "available" | "taken" | "error";

// Debounced server check so we don't fire on every keystroke. In edit mode,
// pass the row's own id as `excludeId` so the cattle's existing tag still
// reads as "available" until the farmer changes it.
function useTagAvailability(
  tag: string,
  excludeId: string | undefined
): TagAvailability {
  const [state, setState] = useState<TagAvailability>("idle");

  useEffect(() => {
    const trimmed = tag.trim();
    if (trimmed.length === 0) {
      setState("idle");
      return;
    }
    setState("checking");
    let cancelled = false;
    const handle = setTimeout(async () => {
      try {
        const { available } = await checkCattleTagAvailableAction({
          tag_number: trimmed,
          exclude_id: excludeId,
        });
        if (!cancelled) {
          setState(available ? "available" : "taken");
        }
      } catch {
        if (!cancelled) {
          setState("error");
        }
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [tag, excludeId]);

  return state;
}

type TagFieldProps = {
  excludeId: string | undefined;
  onAvailabilityChange: (state: TagAvailability) => void;
};

// Lives inside Formik so it can call `useField` for the tag value. Owns
// the debounced availability check and the Generate button. Reports its
// state up so the submit button can react.
function TagField({ excludeId, onAvailabilityChange }: TagFieldProps) {
  return (
    <FastField name="tag_number">
      {({ field, meta, form }: FastFieldProps<string>) => (
        <TagFieldInner
          excludeId={excludeId}
          field={field}
          form={form}
          meta={meta}
          onAvailabilityChange={onAvailabilityChange}
        />
      )}
    </FastField>
  );
}

type TagFieldInnerProps = TagFieldProps & FastFieldProps<string>;

function TagFieldInner({
  excludeId,
  field,
  form,
  meta,
  onAvailabilityChange,
}: TagFieldInnerProps) {
  const availability = useTagAvailability(field.value, excludeId);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    onAvailabilityChange(availability);
  }, [availability, onAvailabilityChange]);

  const validationError = meta.touched ? meta.error : undefined;
  const takenError =
    availability === "taken"
      ? "This tag is already used in your herd."
      : undefined;
  const errorMessage = validationError ?? takenError;
  const showAvailable =
    availability === "available" && field.value.trim().length > 0;

  return (
    <FormRow error={errorMessage} htmlFor="tag_number" label="Tag *">
      <InputGroup>
        <InputGroupInput
          {...field}
          aria-invalid={Boolean(errorMessage)}
          id="tag_number"
          placeholder="840-XXX-XXXX-XXXX or A-0001"
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            aria-label="Generate tag"
            disabled={generating}
            onClick={async () => {
              setGenerating(true);
              try {
                const { tag } = await generateCattleTagAction();
                form.setFieldValue("tag_number", tag);
                form.setFieldTouched("tag_number", true, false);
              } catch {
                // Toasting is handled at the mutations layer; a silent
                // failure here is fine — the farmer can retry or type.
              } finally {
                setGenerating(false);
              }
            }}
            size="xs"
            type="button"
          >
            {generating ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Sparkles />
            )}
            Generate
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {availability === "checking" ? (
        <p className="flex items-center gap-1 text-muted-foreground text-sm">
          <Loader2 className="size-3 animate-spin" /> Checking…
        </p>
      ) : null}
      {showAvailable ? (
        <p className="flex items-center gap-1 text-emerald-600 text-sm">
          <Check className="size-3" /> Available
        </p>
      ) : null}
    </FormRow>
  );
}

export function AnimalFormModal() {
  const { animalForm, setModal } = useGlobalModal();
  const { onCreate, onUpdate } = useCattleMutations();
  const [createMore, setCreateMore] = useState(false);
  const [tagAvailability, setTagAvailability] =
    useState<TagAvailability>("idle");

  // Edit when the store carries a cattle row in props, create otherwise.
  // Cast through `unknown` is unnecessary — props is already CattleRow|null.
  const editingAnimal = animalForm.props;
  const isEdit = Boolean(editingAnimal);

  const close = () =>
    setModal({ animalForm: { open: false, props: null } });

  const initialFormValues = editingAnimal
    ? cattleToFormValues(editingAnimal)
    : cattleFormInitialValues;

  const handleSubmit = async (
    values: FormValues,
    helpers: FormikHelpers<FormValues>
  ) => {
    // Re-parse on submit. Formik already runs `validate` on change/blur,
    // but parsing here narrows the union types (e.g. `breed: string` ->
    // `breed: BreedEnum`) so the transformer's input is fully typed.
    const parsed = cattleFormSchema.safeParse(values);
    if (!parsed.success) {
      return;
    }
    try {
      if (editingAnimal) {
        await onUpdate.mutateAsync({
          id: editingAnimal.id,
          ...cattleFormToCreateInput(parsed.data),
        });
      } else {
        await onCreate.mutateAsync(cattleFormToCreateInput(parsed.data));
      }
      helpers.resetForm({
        values: editingAnimal ? values : cattleFormInitialValues,
      });
      if (!createMore || isEdit) {
        close();
      }
    } catch {
      // Toast handled inside useCattleMutations.
    }
  };

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          close();
        }
      }}
      open={animalForm.open}
    >
      <DialogContent
        className="w-[min(95vw,900px)] max-w-[min(95vw,900px)] sm:max-w-[min(95vw,900px)]"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit animal" : "Add new animal"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Update details for ${editingAnimal?.name ?? editingAnimal?.tag_number}.`
              : "Register a new animal in your herd."}
          </DialogDescription>
        </DialogHeader>

        <Formik<FormValues>
          enableReinitialize
          initialValues={initialFormValues}
          onSubmit={handleSubmit}
          validate={validate}
          validateOnBlur
          validateOnChange
          validateOnMount
        >
          {({ isSubmitting, isValid }) => (
            <Form className="flex flex-col gap-6">
              <div className="flex flex-col gap-5">
                <TagField
                  excludeId={editingAnimal?.id}
                  onAvailabilityChange={setTagAvailability}
                />

                <FastField name="name">
                  {({ field, meta }: FastFieldProps<string>) => (
                    <FormRow
                      error={meta.touched ? meta.error : undefined}
                      htmlFor="name"
                      label="Name"
                    >
                      <Input
                        {...field}
                        aria-invalid={Boolean(meta.touched && meta.error)}
                        id="name"
                        placeholder="Bessie"
                      />
                    </FormRow>
                  )}
                </FastField>

                {/* Select pair #1: Breed + Gender */}
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                  <FastField name="breed">
                    {({ field, meta, form }: FastFieldProps<string>) => (
                      <FormRow
                        error={meta.touched ? meta.error : undefined}
                        htmlFor="breed"
                        label="Breed *"
                      >
                        <Select
                          onValueChange={(value) => {
                            form.setFieldValue(field.name, value);
                            form.setFieldTouched(field.name, true, false);
                          }}
                          value={field.value}
                        >
                          <SelectTrigger
                            aria-invalid={Boolean(meta.touched && meta.error)}
                            id="breed"
                            style={{ width: "100%" }}
                          >
                            <SelectValue placeholder="Pick a breed" />
                          </SelectTrigger>
                          <SelectContent>
                            {breedOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormRow>
                    )}
                  </FastField>

                  <FastField name="gender">
                    {({ field, meta, form }: FastFieldProps<string>) => (
                      <FormRow
                        error={meta.touched ? meta.error : undefined}
                        htmlFor="gender"
                        label="Gender *"
                      >
                        <Select
                          onValueChange={(value) => {
                            form.setFieldValue(field.name, value);
                            form.setFieldTouched(field.name, true, false);
                          }}
                          value={field.value}
                        >
                          <SelectTrigger
                            aria-invalid={Boolean(meta.touched && meta.error)}
                            id="gender"
                            style={{ width: "100%" }}
                          >
                            <SelectValue placeholder="Pick a gender" />
                          </SelectTrigger>
                          <SelectContent>
                            {genderOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormRow>
                    )}
                  </FastField>
                </div>

                <FastField name="date_of_birth">
                  {({ field, meta, form }: FastFieldProps<string>) => (
                    <FormRow
                      error={meta.touched ? meta.error : undefined}
                      htmlFor="date_of_birth"
                      label="Date of birth *"
                    >
                      <DateField
                        disableFuture
                        id="date_of_birth"
                        invalid={Boolean(meta.touched && meta.error)}
                        onChange={(next) => {
                          form.setFieldValue(field.name, next);
                          form.setFieldTouched(field.name, true, false);
                        }}
                        placeholder="Pick birth date"
                        value={field.value}
                      />
                    </FormRow>
                  )}
                </FastField>

                {/* Select pair #2: Status + Acquisition */}
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                  <FastField name="status">
                    {({ field, form }: FastFieldProps<string>) => (
                      <FormRow htmlFor="status" label="Status">
                        <Select
                          onValueChange={(value) =>
                            form.setFieldValue(field.name, value)
                          }
                          value={field.value}
                        >
                          <SelectTrigger
                            id="status"
                            style={{ width: "100%" }}
                          >
                            <SelectValue placeholder="Pick a status" />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormRow>
                    )}
                  </FastField>

                  <FastField name="acquisition">
                    {({ field, meta, form }: FastFieldProps<string>) => (
                      <FormRow
                        error={meta.touched ? meta.error : undefined}
                        htmlFor="acquisition"
                        label="Acquisition *"
                      >
                        <Select
                          onValueChange={(value) => {
                            form.setFieldValue(field.name, value);
                            form.setFieldTouched(field.name, true, false);
                          }}
                          value={field.value}
                        >
                          <SelectTrigger
                            aria-invalid={Boolean(meta.touched && meta.error)}
                            id="acquisition"
                            style={{ width: "100%" }}
                          >
                            <SelectValue placeholder="How did you acquire it?" />
                          </SelectTrigger>
                          <SelectContent>
                            {acquisitionOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormRow>
                    )}
                  </FastField>
                </div>

                <FastField name="weight_kg">
                  {({ field, meta }: FastFieldProps<string>) => (
                    <FormRow
                      error={meta.touched ? meta.error : undefined}
                      htmlFor="weight_kg"
                      label="Weight (kg)"
                    >
                      <Input
                        {...field}
                        aria-invalid={Boolean(meta.touched && meta.error)}
                        autoComplete="off"
                        id="weight_kg"
                        inputMode="decimal"
                        placeholder="450"
                        type="text"
                      />
                    </FormRow>
                  )}
                </FastField>

                <FastField name="acquired_date">
                  {({ field, form }: FastFieldProps<string>) => (
                    <FormRow htmlFor="acquired_date" label="Acquired date">
                      <DateField
                        disableFuture
                        id="acquired_date"
                        onChange={(next) => {
                          form.setFieldValue(field.name, next);
                          form.setFieldTouched(field.name, true, false);
                        }}
                        placeholder="Pick acquired date"
                        value={field.value}
                      />
                    </FormRow>
                  )}
                </FastField>

                <FastField name="notes">
                  {({ field }: FastFieldProps<string>) => (
                    <FormRow
                      description="Optional — anything you'd want to see later in the herd detail view."
                      htmlFor="notes"
                      label="Notes"
                    >
                      <Textarea
                        {...field}
                        id="notes"
                        placeholder="Anything worth remembering…"
                        rows={3}
                      />
                    </FormRow>
                  )}
                </FastField>
              </div>

              <DialogFooter className="items-center gap-3 sm:justify-between">
                {/* Create-more only makes sense when adding new animals — in */}
                {/* edit mode we always close after a successful save. */}
                {isEdit ? (
                  <div />
                ) : (
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={createMore}
                      id="create_more"
                      onCheckedChange={setCreateMore}
                    />
                    <Label className="cursor-pointer" htmlFor="create_more">
                      Create more
                    </Label>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Button onClick={close} type="button" variant="outline">
                    Cancel
                  </Button>
                  <Button
                    disabled={
                      isSubmitting ||
                      !isValid ||
                      tagAvailability === "taken" ||
                      tagAvailability === "checking"
                    }
                    type="submit"
                  >
                    {isEdit ? "Save changes" : "Add animal"}
                  </Button>
                </div>
              </DialogFooter>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
}
