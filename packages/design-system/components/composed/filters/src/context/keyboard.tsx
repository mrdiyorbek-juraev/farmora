"use client";

// Per-field async-dispatcher registry. AsyncOptionsPopover instances
// register a `(index: number) => boolean` callback for their currently
// loaded option set; the picker's document-level keyboard listener
// (lives in `Filters`) calls into the registry when Alt+N is pressed
// while an async submenu is open. The callback returns true if the
// index resolved to a real option, false otherwise — that's the
// listener's signal to consume the event.
//
// Implemented as context so children can register without prop
// threading; the `Filters` component owns the underlying ref Map.

import { createContext, useContext } from "react";

export type AsyncDispatcher = (index: number) => boolean;

export interface FilterKeyboardContextValue {
  registerAsyncDispatcher: (
    fieldKey: string,
    handler: AsyncDispatcher
  ) => () => void;
}

// Default is a no-op registry — components rendered outside a
// `Filters` parent (e.g. the chip's SelectOptionsPopover) get a
// harmless register that does nothing.
const noop = (): (() => void) => () => {
  // intentionally empty
};

export const FilterKeyboardContext = createContext<FilterKeyboardContextValue>({
  registerAsyncDispatcher: noop,
});

export const useFilterKeyboardContext = () => useContext(FilterKeyboardContext);
