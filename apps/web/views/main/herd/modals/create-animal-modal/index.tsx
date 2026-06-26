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
import { CalendarIcon } from "lucide-react";
import { useState } from "react";

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

export function AnimalFormModal() {
  const { animalForm, setModal } = useGlobalModal();
  const { onCreate, onUpdate } = useCattleMutations();
  const [createMore, setCreateMore] = useState(false);

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
      {/* `sm:max-w-[min(...)]` is needed to beat DialogContent's default */}
      {/* `sm:max-w-sm` — tailwind-merge groups conflicts per variant. */}
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
                <FastField name="tag_number">
                  {({ field, meta }: FastFieldProps<string>) => (
                    <FormRow
                      error={meta.touched ? meta.error : undefined}
                      htmlFor="tag_number"
                      label="Tag *"
                    >
                      <Input
                        {...field}
                        aria-invalid={Boolean(meta.touched && meta.error)}
                        id="tag_number"
                        placeholder="A-0001"
                      />
                    </FormRow>
                  )}
                </FastField>

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
                    disabled={isSubmitting || !isValid}
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
