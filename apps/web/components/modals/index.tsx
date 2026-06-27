"use client";

import { Activity } from "react";

import { useGlobalModal } from "@/stores/shared/modal-store";

import { AnimalFormModal } from "./animal-form-modal";
import { RecordWeightModal } from "./record-weight-modal";

export function GlobalModals() {
  const animalForm = useGlobalModal((state) => state.animalForm);
  const weightForm = useGlobalModal((state) => state.weightForm);

  return (
    <>
      <Activity mode={animalForm.open ? "visible" : "hidden"}>
        <AnimalFormModal />
      </Activity>
      <Activity mode={weightForm.open ? "visible" : "hidden"}>
        <RecordWeightModal />
      </Activity>
    </>
  );
}
