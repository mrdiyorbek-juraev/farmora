"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/design-system/components/ui/dialog";
import { Form, Formik } from "formik";

import type { CattleFormValues } from "@/models/cattle";

import { AnimalFormFields } from "./customs/animal-form-fields";
import { AnimalFormFooter } from "./customs/animal-form-footer";
import { useAnimalForm } from "./features";

export function AnimalFormModal() {
  const {
    open,
    isEdit,
    title,
    description,
    excludeId,
    initialValues,
    validate,
    createMore,
    setCreateMore,
    tagAvailability,
    setTagAvailability,
    close,
    handleSubmit,
  } = useAnimalForm();

  return (
    <Dialog
      onOpenChange={(next) => {
        if (!next) {
          close();
        }
      }}
      open={open}
    >
      <DialogContent
        className="w-[min(95vw,900px)] max-w-[min(95vw,900px)] sm:max-w-[min(95vw,900px)]"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Formik<CattleFormValues>
          enableReinitialize
          initialValues={initialValues}
          onSubmit={handleSubmit}
          validate={validate}
          validateOnBlur
          validateOnChange
          validateOnMount
        >
          {({ isSubmitting, isValid }) => (
            <Form className="flex flex-col gap-6">
              <AnimalFormFields
                excludeId={excludeId}
                isEdit={isEdit}
                onAvailabilityChange={setTagAvailability}
              />
              <AnimalFormFooter
                createMore={createMore}
                isEdit={isEdit}
                isSubmitting={isSubmitting}
                isValid={isValid}
                onCancel={close}
                onCreateMoreChange={setCreateMore}
                tagAvailability={tagAvailability}
              />
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
}
