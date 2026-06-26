"use client";

import type { CattleWithHistory } from "@/models/cattle";
import { create, type StateCreator } from "zustand";

// ─── Global Modal ────────────────────────────────────────────────────────────
//
// One store, many modals. Add a new entry per modal:
//   <modalName>: { open: boolean; props: <PayloadType> | null }
//
// Toggle with `setModal({ <modalName>: { open: true, props: ... } })`.
// `props: null` means create / blank; a populated `props` means edit.

interface GlobalModal {
  animalForm: {
    open: boolean;
    props: CattleWithHistory | null;
  };
  setModal: (payload: Partial<GlobalModal>) => void;
}

export const initialGlobalModal: Omit<GlobalModal, "setModal"> = {
  animalForm: {
    open: false,
    props: null,
  },
};

const globalModal: StateCreator<GlobalModal> = (set) => ({
  ...initialGlobalModal,
  setModal: (payload) => set((state) => ({ ...state, ...payload })),
});

export const useGlobalModal = create<GlobalModal>()(globalModal);
