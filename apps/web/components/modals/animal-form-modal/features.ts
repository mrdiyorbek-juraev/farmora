"use client";

import type { FormikHelpers } from "formik";
import { useState } from "react";

import { zodValidate } from "@/lib/forms/zod-validate";
import {
  type CattleFormValues,
  cattleFormInitialValues,
  cattleFormSchema,
  cattleFormToCreateInput,
  cattleToFormValues,
} from "@/models/cattle";
import { useCattleMutations } from "@/services/cattle/mutations";
import { useGlobalModal } from "@/stores/shared/modal-store";

import type { TagAvailability } from "./types";

const validate = zodValidate(cattleFormSchema);

/**
 * All behavior for the animal create/edit modal. Reads its open/edit state
 * from the global modal store, owns the transient form state (create-more,
 * tag availability), and exposes the submit handler. The view component
 * stays a thin Dialog + Formik shell.
 */
export function useAnimalForm() {
  const { animalForm, setModal } = useGlobalModal();
  const { onCreate, onUpdate } = useCattleMutations();
  const [createMore, setCreateMore] = useState(false);
  const [tagAvailability, setTagAvailability] =
    useState<TagAvailability>("idle");

  // Edit when the store carries a cattle row in props, create otherwise.
  const editingAnimal = animalForm.props;
  const isEdit = Boolean(editingAnimal);

  const close = () => setModal({ animalForm: { open: false, props: null } });

  const initialValues = editingAnimal
    ? cattleToFormValues(editingAnimal)
    : cattleFormInitialValues;

  const title = isEdit ? "Edit animal" : "Add new animal";
  const description = isEdit
    ? `Update details for ${editingAnimal?.name ?? editingAnimal?.tag_number}.`
    : "Register a new animal in your herd.";

  const handleSubmit = async (
    values: CattleFormValues,
    helpers: FormikHelpers<CattleFormValues>
  ) => {
    // Re-parse on submit. Formik already validates on change/blur, but
    // parsing here narrows the union types (e.g. `breed: string` ->
    // `breed: BreedEnum`) so the transformer's input is fully typed.
    const parsed = cattleFormSchema.safeParse(values);
    if (!parsed.success) {
      return;
    }
    try {
      const input = cattleFormToCreateInput(parsed.data);
      if (editingAnimal) {
        await onUpdate.mutateAsync({ id: editingAnimal.id, ...input });
      } else {
        await onCreate.mutateAsync(input);
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

  return {
    open: animalForm.open,
    isEdit,
    title,
    description,
    excludeId: editingAnimal?.id,
    initialValues,
    validate,
    createMore,
    setCreateMore,
    tagAvailability,
    setTagAvailability,
    close,
    handleSubmit,
  };
}
