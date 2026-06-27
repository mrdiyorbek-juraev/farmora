"use client";

import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useMemo,
  useState,
} from "react";

type AskAiContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  close: () => void;
};

const AskAiContext = createContext<AskAiContextValue | null>(null);

export function AskAiProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((prev) => !prev), []);
  const close = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ open, setOpen, toggle, close }),
    [open, toggle, close]
  );

  return (
    <AskAiContext.Provider value={value}>{children}</AskAiContext.Provider>
  );
}

export function useAskAi() {
  const ctx = use(AskAiContext);
  if (!ctx) {
    throw new Error("useAskAi must be used inside AskAiProvider");
  }
  return ctx;
}
