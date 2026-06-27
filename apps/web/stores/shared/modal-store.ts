"use client";

import type { CattleWithHistory } from "@/models/cattle";
import { create, type StateCreator } from "zustand";

// ─── Global Modal ────────────────────────────────────────────────────────────
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
