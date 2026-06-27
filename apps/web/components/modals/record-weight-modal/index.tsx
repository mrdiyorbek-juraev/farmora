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
  type WeightFormValues,
  weightFormInitialValues,
  weightFormSchema,
  weightFormToRecordInput,
} from "@/models/weight";
import { useWeightMutations } from "@/services/weight/mutations";
import { useGlobalModal } from "@/stores/shared/modal-store";

const validate = zodValidate(weightFormSchema);
const DATE_WIRE_FORMAT = "yyyy-MM-dd";

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

function parseDateValue(value: string | undefined): Date | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = parse(value, DATE_WIRE_FORMAT, new Date());
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function DateField({
  id,
  value,
  onChange,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (next: string) => void;
  invalid?: boolean;
}) {
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
          {date ? format(date, "PPP") : "Pick a date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          captionLayout="dropdown"
          disabled={{ after: new Date() }}
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

export function RecordWeightModal() {
  const { weightForm, setModal } = useGlobalModal();
  const cattleId = weightForm.cattleId ?? "";
  const { onRecord } = useWeightMutations(cattleId);

  const close = () => setModal({ weightForm: { open: false, cattleId: null } });

  const handleSubmit = async (
    values: WeightFormValues,
    helpers: FormikHelpers<WeightFormValues>
  ) => {
    const parsed = weightFormSchema.safeParse(values);
    if (!(parsed.success && cattleId)) {
      return;
    }
    try {
      await onRecord.mutateAsync(
        weightFormToRecordInput(cattleId, parsed.data)
      );
      helpers.resetForm({ values: weightFormInitialValues });
      close();
    } catch {
      // Toast handled inside useWeightMutations.
    }
  };

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          close();
        }
      }}
      open={weightForm.open}
    >
      <DialogContent className="w-[min(95vw,480px)] max-w-[min(95vw,480px)] sm:max-w-[min(95vw,480px)]">
        <DialogHeader>
          <DialogTitle>Record weight</DialogTitle>
          <DialogDescription>
            Log a new weigh-in. Enter the weight in kilograms — the history
            shows it in pounds.
          </DialogDescription>
        </DialogHeader>

        <Formik<WeightFormValues>
          initialValues={weightFormInitialValues}
          onSubmit={handleSubmit}
          validate={validate}
          validateOnBlur
          validateOnChange
          validateOnMount
        >
          {({ isSubmitting, isValid }) => (
            <Form className="flex flex-col gap-5">
              <FastField name="weight_kg">
                {({ field, meta }: FastFieldProps<string>) => (
                  <FormRow
                    error={meta.touched ? meta.error : undefined}
                    htmlFor="weight_kg"
                    label="Weight (kg) *"
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

              <FastField name="measured_at">
                {({ field, meta, form }: FastFieldProps<string>) => (
                  <FormRow
                    error={meta.touched ? meta.error : undefined}
                    htmlFor="measured_at"
                    label="Date weighed *"
                  >
                    <DateField
                      id="measured_at"
                      invalid={Boolean(meta.touched && meta.error)}
                      onChange={(next) => {
                        form.setFieldValue(field.name, next);
                        form.setFieldTouched(field.name, true, false);
                      }}
                      value={field.value}
                    />
                  </FormRow>
                )}
              </FastField>

              <FastField name="note">
                {({ field }: FastFieldProps<string>) => (
                  <FormRow
                    description="Optional — body condition, conditions at weigh-in, etc."
                    htmlFor="note"
                    label="Note"
                  >
                    <Textarea
                      {...field}
                      id="note"
                      placeholder="Anything worth remembering…"
                      rows={3}
                    />
                  </FormRow>
                )}
              </FastField>

              <DialogFooter className="items-center gap-3 sm:justify-end">
                <Button onClick={close} type="button" variant="outline">
                  Cancel
                </Button>
                <Button disabled={isSubmitting || !isValid} type="submit">
                  Record weight
                </Button>
              </DialogFooter>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
}
