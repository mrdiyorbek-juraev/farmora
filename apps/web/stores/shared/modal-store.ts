"use client";

import { create, type StateCreator } from "zustand";
import type { CattleWithHistory } from "@/models/cattle";

// ─── Global Modal ────────────────────────────────────────────────────────────
interface GlobalModal {
  animalForm: {
    open: boolean;
    props: CattleWithHistory | null;
  };
  search: {
    open: boolean;
  };
  setModal: (payload: Partial<GlobalModal>) => void;
  weightForm: {
    open: boolean;
    cattleId: string | null;
  };
}

export const initialGlobalModal: Omit<GlobalModal, "setModal"> = {
  animalForm: {
    open: false,
    props: null,
  },
  search: {
    open: false,
  },
  weightForm: {
    open: false,
    cattleId: null,
  },
};

const globalModal: StateCreator<GlobalModal> = (set) => ({
  ...initialGlobalModal,
  setModal: (payload) => set((state) => ({ ...state, ...payload })),
});

export const useGlobalModal = create<GlobalModal>()(globalModal);
