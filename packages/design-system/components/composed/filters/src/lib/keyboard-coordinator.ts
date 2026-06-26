// Pure logic for the filter picker's keyboard handler. Lives outside
// the component so the cmdk/Radix integration in the JSX layer doesn't
// drag its own complexity into tests — this file is plain TS, plain
// data in / plain data out, no React.
//
// Two responsibilities:
//   1. Decide whether a given KeyboardEvent should be handled by the
//      picker, and what the resulting filter mutation should be.
//   2. Hold the async-dispatcher registry so AsyncOptionsPopover
//      instances can route Alt+N for their currently-loaded options
//      through the same coordinator without re-implementing the key
//      detection rules.

import type { Filter, FilterFieldConfig, FilterOption } from "../types";

// What the handler reads when an event arrives. Held in a ref so the
// document listener stays subscribed across re-renders without rebinding.
export interface KeyboardCoordinatorState<T> {
  openSubKey: string | null;
  fieldsMap: Record<string, FilterFieldConfig<T>>;
  filters: Filter<T>[];
}

// Outcome the listener turns into side effects: close the submenu,
// apply a filter mutation, or dispatch to an async submenu's local
// handler. Returning a structured result keeps the side-effect
// callsites out of the pure-decision code.
export type KeyboardOutcome<T> =
  | { kind: "ignore" }
  | { kind: "close-submenu" }
  | {
      kind: "apply";
      field: FilterFieldConfig<T>;
      values: FilterOption<T>[];
    }
  | { kind: "async-dispatch"; fieldKey: string; index: number };

// Single source of truth for the Alt+digit allowlist. `e.key` on
// Windows/Linux is the digit character; on Mac with Option held the
// browser may emit a special character ("¡", "™"…), but we still
// honor it only when the digit row is detectable via `e.code`. We
// fall through to `e.key` for direct compatibility and `e.code` as
// the deterministic alternative.
//
// e.code for digit row: "Digit1" … "Digit9". This avoids the
// Mac-Option-transformed-character problem entirely.
function readDigitKey(e: {
  key: string;
  code?: string;
}): number | null {
  // Prefer code — it's the physical key, unaffected by modifiers.
  if (e.code && /^Digit[1-9]$/.test(e.code)) {
    return Number(e.code.slice(5));
  }
  // Fall through to key for environments without e.code (rare).
  if (e.key >= "1" && e.key <= "9") {
    return Number(e.key);
  }
  return null;
}

// Build the next FilterOption[] for an Alt+N pick. Multi-select
// toggles, single-select replaces. Extracted so the test can verify
// the toggle math without spinning up React.
export function computeNextValues<T>(
  field: FilterFieldConfig<T>,
  current: FilterOption<T>[],
  picked: FilterOption<T>
): FilterOption<T>[] {
  const isMulti = field.type === "multiselect";
  if (!isMulti) {
    return [picked];
  }
  const isSelected = current.some((v) => v.value === picked.value);
  return isSelected
    ? current.filter((v) => v.value !== picked.value)
    : [...current, picked];
}

// Pure-logic decision function. Hands back what the listener should
// do; the listener owns the actual `preventDefault` / `stopPropagation`
// and the state mutations.
export function decideKeyOutcome<T>(
  e: { key: string; code?: string; altKey: boolean; metaKey: boolean; ctrlKey: boolean },
  state: KeyboardCoordinatorState<T>
): KeyboardOutcome<T> {
  // Escape with a submenu open: close the submenu only.
  if (e.key === "Escape" && state.openSubKey) {
    return { kind: "close-submenu" };
  }

  // Alt+digit: pick the Nth option from the open submenu.
  if (!state.openSubKey || !e.altKey || e.metaKey || e.ctrlKey) {
    return { kind: "ignore" };
  }

  const digit = readDigitKey(e);
  if (digit === null) {
    return { kind: "ignore" };
  }
  const field = state.fieldsMap[state.openSubKey];
  if (!field) {
    return { kind: "ignore" };
  }
  const index = digit - 1;

  // Async fields don't have a stable field.options array — their
  // options stream in over time. Dispatch to a per-field handler
  // registered by AsyncOptionsPopover (which closes over the
  // currently-loaded options).
  if (field.async) {
    return { kind: "async-dispatch", fieldKey: state.openSubKey, index };
  }

  const picked = field.options?.[index];
  if (!picked) {
    return { kind: "ignore" };
  }

  const existing = state.filters.find((f) => f.field === state.openSubKey);
  const current = (existing?.values as FilterOption<T>[]) ?? [];
  const values = computeNextValues(field, current, picked);
  return { kind: "apply", field, values };
}
