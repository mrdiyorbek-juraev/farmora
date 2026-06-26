import { describe, expect, it } from "vitest";
import type { Filter, FilterFieldConfig } from "../../types";
import {
  computeNextValues,
  decideKeyOutcome,
  type KeyboardCoordinatorState,
} from "../keyboard-coordinator";

// ─── Fixtures ────────────────────────────────────────────────────────

interface KeyEvt {
  key: string;
  code?: string;
  altKey: boolean;
  metaKey: boolean;
  ctrlKey: boolean;
}

const evt = (overrides: Partial<KeyEvt> = {}): KeyEvt => ({
  key: "",
  altKey: false,
  metaKey: false,
  ctrlKey: false,
  ...overrides,
});

const sync = (
  key: string,
  type: "select" | "multiselect",
  options: { value: string; label: string }[]
): FilterFieldConfig => ({ key, label: key, type, options });

const async_ = (key: string, type: "select" | "multiselect"): FilterFieldConfig => ({
  key,
  label: key,
  type,
  async: {
    load: async () => ({ options: [] }),
  },
});

const state = <T>(
  fields: FilterFieldConfig<T>[],
  openSubKey: string | null,
  filters: Filter<T>[] = []
): KeyboardCoordinatorState<T> => ({
  openSubKey,
  fieldsMap: Object.fromEntries(fields.map((f) => [f.key as string, f])),
  filters,
});

// ─── decideKeyOutcome ───────────────────────────────────────────────

describe("decideKeyOutcome", () => {
  it("returns close-submenu on Esc when a submenu is open", () => {
    const s = state([sync("status", "multiselect", [])], "status");
    expect(decideKeyOutcome(evt({ key: "Escape" }), s).kind).toBe(
      "close-submenu"
    );
  });

  it("ignores Esc when no submenu is open", () => {
    const s = state([sync("status", "multiselect", [])], null);
    expect(decideKeyOutcome(evt({ key: "Escape" }), s).kind).toBe("ignore");
  });

  it("ignores Alt+digit when no submenu is open", () => {
    const s = state([sync("status", "multiselect", [])], null);
    expect(
      decideKeyOutcome(evt({ key: "1", code: "Digit1", altKey: true }), s).kind
    ).toBe("ignore");
  });

  it("ignores plain digits (no Alt)", () => {
    const opts = [{ value: "A", label: "A" }];
    const s = state([sync("status", "multiselect", opts)], "status");
    expect(
      decideKeyOutcome(evt({ key: "1", code: "Digit1" }), s).kind
    ).toBe("ignore");
  });

  it("ignores Alt+Cmd+digit (modifier conflict)", () => {
    const opts = [{ value: "A", label: "A" }];
    const s = state([sync("status", "multiselect", opts)], "status");
    expect(
      decideKeyOutcome(
        evt({ key: "1", code: "Digit1", altKey: true, metaKey: true }),
        s
      ).kind
    ).toBe("ignore");
  });

  it("returns apply with the picked option for Alt+1 on a sync field", () => {
    const opts = [
      { value: "A", label: "A" },
      { value: "B", label: "B" },
    ];
    const s = state([sync("status", "multiselect", opts)], "status");
    const out = decideKeyOutcome(
      evt({ key: "1", code: "Digit1", altKey: true }),
      s
    );
    expect(out.kind).toBe("apply");
    if (out.kind === "apply") {
      expect(out.values).toEqual([{ value: "A", label: "A" }]);
    }
  });

  it("toggles off on multi-select when the picked option is already selected", () => {
    const opts = [
      { value: "A", label: "A" },
      { value: "B", label: "B" },
    ];
    const s = state([sync("status", "multiselect", opts)], "status", [
      {
        id: "f1",
        field: "status",
        operator: "is",
        values: [{ value: "A", label: "A" }],
      },
    ]);
    const out = decideKeyOutcome(
      evt({ key: "1", code: "Digit1", altKey: true }),
      s
    );
    expect(out.kind).toBe("apply");
    if (out.kind === "apply") {
      expect(out.values).toEqual([]);
    }
  });

  it("appends on multi-select when the picked option is not yet selected", () => {
    const opts = [
      { value: "A", label: "A" },
      { value: "B", label: "B" },
    ];
    const s = state([sync("status", "multiselect", opts)], "status", [
      {
        id: "f1",
        field: "status",
        operator: "is",
        values: [{ value: "A", label: "A" }],
      },
    ]);
    const out = decideKeyOutcome(
      evt({ key: "2", code: "Digit2", altKey: true }),
      s
    );
    expect(out.kind).toBe("apply");
    if (out.kind === "apply") {
      expect(out.values).toEqual([
        { value: "A", label: "A" },
        { value: "B", label: "B" },
      ]);
    }
  });

  it("replaces (not toggles) on single-select", () => {
    const opts = [
      { value: "A", label: "A" },
      { value: "B", label: "B" },
    ];
    const s = state([sync("status", "select", opts)], "status", [
      {
        id: "f1",
        field: "status",
        operator: "is",
        values: [{ value: "A", label: "A" }],
      },
    ]);
    const out = decideKeyOutcome(
      evt({ key: "2", code: "Digit2", altKey: true }),
      s
    );
    expect(out.kind).toBe("apply");
    if (out.kind === "apply") {
      expect(out.values).toEqual([{ value: "B", label: "B" }]);
    }
  });

  it("returns async-dispatch for async fields", () => {
    const s = state([async_("tags", "multiselect")], "tags");
    const out = decideKeyOutcome(
      evt({ key: "3", code: "Digit3", altKey: true }),
      s
    );
    expect(out.kind).toBe("async-dispatch");
    if (out.kind === "async-dispatch") {
      expect(out.fieldKey).toBe("tags");
      expect(out.index).toBe(2);
    }
  });

  it("ignores Alt+digit when the index is out of range", () => {
    const opts = [{ value: "A", label: "A" }];
    const s = state([sync("status", "multiselect", opts)], "status");
    expect(
      decideKeyOutcome(evt({ key: "9", code: "Digit9", altKey: true }), s).kind
    ).toBe("ignore");
  });

  it("reads the digit from e.code when e.key is a Mac Option-transformed char", () => {
    // Safari on Mac with Option+1 reports e.key = "¡". We rely on
    // e.code = "Digit1" to recover the physical key.
    const opts = [{ value: "A", label: "A" }];
    const s = state([sync("status", "multiselect", opts)], "status");
    const out = decideKeyOutcome(
      evt({ key: "¡", code: "Digit1", altKey: true }),
      s
    );
    expect(out.kind).toBe("apply");
    if (out.kind === "apply") {
      expect(out.values).toEqual([{ value: "A", label: "A" }]);
    }
  });
});

// ─── computeNextValues ──────────────────────────────────────────────

describe("computeNextValues", () => {
  it("returns a single-element array for single-select replace", () => {
    const field = sync("status", "select", []);
    const current = [{ value: "A", label: "A" }];
    const picked = { value: "B", label: "B" };
    expect(computeNextValues(field, current, picked)).toEqual([picked]);
  });

  it("toggles existing values on multi-select", () => {
    const field = sync("status", "multiselect", []);
    const a = { value: "A", label: "A" };
    const b = { value: "B", label: "B" };
    expect(computeNextValues(field, [a], a)).toEqual([]);
    expect(computeNextValues(field, [a], b)).toEqual([a, b]);
  });
});
