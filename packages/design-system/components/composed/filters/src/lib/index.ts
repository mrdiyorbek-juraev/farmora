import type {
  Filter,
  FilterFieldConfig,
  FilterFieldGroup,
  FilterFieldsConfig,
  FilterGroup,
  FilterI18nConfig,
  FilterOperator,
  FilterOption,
} from "../types";

// Helper functions to handle both flat and grouped field configurations
const isFieldGroup = <T = unknown>(
  item: FilterFieldConfig<T> | FilterFieldGroup<T>
): item is FilterFieldGroup<T> => {
  return "fields" in item && Array.isArray(item.fields);
};

// Helper function to check if a FilterFieldConfig is a group-level configuration
const isGroupLevelField = <T = unknown>(
  field: FilterFieldConfig<T>
): boolean => {
  return Boolean(field.group && field.fields);
};

const flattenFields = <T = unknown>(
  fields: FilterFieldsConfig<T>
): FilterFieldConfig<T>[] => {
  return fields.reduce<FilterFieldConfig<T>[]>((acc, item) => {
    if (isFieldGroup(item)) {
      return [...acc, ...item.fields];
    }
    // Handle group-level fields (new structure)
    if (isGroupLevelField(item)) {
      return [...acc, ...item.fields!];
    }
    return [...acc, item];
  }, []);
};

const getFieldsMap = <T = unknown>(
  fields: FilterFieldsConfig<T>
): Record<string, FilterFieldConfig<T>> => {
  const flatFields = flattenFields(fields);
  return flatFields.reduce(
    (acc, field) => {
      // Only add fields that have a key (skip group-level configurations)
      if (field.key) {
        acc[field.key] = field;
      }
      return acc;
    },
    {} as Record<string, FilterFieldConfig<T>>
  );
};

// Helper function to create operators from i18n config
const createOperatorsFromI18n = (
  i18n: FilterI18nConfig
): Record<string, FilterOperator[]> => ({
  select: [
    { value: "is", label: i18n.operators.is },
    { value: "is_not", label: i18n.operators.isNot },
    { value: "empty", label: i18n.operators.empty },
    { value: "not_empty", label: i18n.operators.notEmpty },
  ],
  multiselect: [
    { value: "is_any_of", label: i18n.operators.isAnyOf },
    { value: "is_not_any_of", label: i18n.operators.isNotAnyOf },
    { value: "includes_all", label: i18n.operators.includesAll },
    { value: "excludes_all", label: i18n.operators.excludesAll },
    // Set-semantics variants — overlap, superset, disjoint — exposed
    // here so consumers can pick spec-aligned operator names without
    // having to define `field.operators` from scratch.
    { value: "has_any_of", label: i18n.operators.hasAnyOf },
    { value: "has_all_of", label: i18n.operators.hasAllOf },
    { value: "has_none_of", label: i18n.operators.hasNoneOf },
    { value: "empty", label: i18n.operators.empty },
    { value: "not_empty", label: i18n.operators.notEmpty },
  ],
  date: [
    { value: "is", label: i18n.operators.is },
    { value: "is_not", label: i18n.operators.isNot },
    { value: "before", label: i18n.operators.before },
    { value: "after", label: i18n.operators.after },
    { value: "is_within", label: i18n.operators.isWithin },
    { value: "empty", label: i18n.operators.empty },
    { value: "not_empty", label: i18n.operators.notEmpty },
  ],
  daterange: [
    { value: "between", label: i18n.operators.between },
    { value: "not_between", label: i18n.operators.notBetween },
    { value: "is_within", label: i18n.operators.isWithin },
    { value: "empty", label: i18n.operators.empty },
    { value: "not_empty", label: i18n.operators.notEmpty },
  ],
  text: [
    { value: "contains", label: i18n.operators.contains },
    { value: "not_contains", label: i18n.operators.notContains },
    { value: "starts_with", label: i18n.operators.startsWith },
    { value: "ends_with", label: i18n.operators.endsWith },
    { value: "is", label: i18n.operators.isExactly },
    { value: "empty", label: i18n.operators.empty },
    { value: "not_empty", label: i18n.operators.notEmpty },
  ],
  number: [
    { value: "equals", label: i18n.operators.equals },
    { value: "not_equals", label: i18n.operators.notEquals },
    { value: "greater_than", label: i18n.operators.greaterThan },
    { value: "greater_than_or_equal", label: i18n.operators.greaterThanOrEqual },
    { value: "less_than", label: i18n.operators.lessThan },
    { value: "less_than_or_equal", label: i18n.operators.lessThanOrEqual },
    { value: "between", label: i18n.operators.between },
    { value: "empty", label: i18n.operators.empty },
    { value: "not_empty", label: i18n.operators.notEmpty },
  ],
  numberrange: [
    { value: "between", label: i18n.operators.between },
    { value: "overlaps", label: i18n.operators.overlaps },
    { value: "contains", label: i18n.operators.contains },
    { value: "empty", label: i18n.operators.empty },
    { value: "not_empty", label: i18n.operators.notEmpty },
  ],
  boolean: [
    { value: "is", label: i18n.operators.is },
    { value: "is_not", label: i18n.operators.isNot },
    { value: "empty", label: i18n.operators.empty },
    { value: "not_empty", label: i18n.operators.notEmpty },
  ],
  email: [
    { value: "contains", label: i18n.operators.contains },
    { value: "not_contains", label: i18n.operators.notContains },
    { value: "starts_with", label: i18n.operators.startsWith },
    { value: "ends_with", label: i18n.operators.endsWith },
    { value: "is", label: i18n.operators.isExactly },
    { value: "empty", label: i18n.operators.empty },
    { value: "not_empty", label: i18n.operators.notEmpty },
  ],
  url: [
    { value: "contains", label: i18n.operators.contains },
    { value: "not_contains", label: i18n.operators.notContains },
    { value: "starts_with", label: i18n.operators.startsWith },
    { value: "ends_with", label: i18n.operators.endsWith },
    { value: "is", label: i18n.operators.isExactly },
    { value: "empty", label: i18n.operators.empty },
    { value: "not_empty", label: i18n.operators.notEmpty },
  ],
  tel: [
    { value: "contains", label: i18n.operators.contains },
    { value: "not_contains", label: i18n.operators.notContains },
    { value: "starts_with", label: i18n.operators.startsWith },
    { value: "ends_with", label: i18n.operators.endsWith },
    { value: "is", label: i18n.operators.isExactly },
    { value: "empty", label: i18n.operators.empty },
    { value: "not_empty", label: i18n.operators.notEmpty },
  ],
  time: [
    { value: "before", label: i18n.operators.before },
    { value: "after", label: i18n.operators.after },
    { value: "is", label: i18n.operators.is },
    { value: "between", label: i18n.operators.between },
    { value: "empty", label: i18n.operators.empty },
    { value: "not_empty", label: i18n.operators.notEmpty },
  ],
  datetime: [
    { value: "before", label: i18n.operators.before },
    { value: "after", label: i18n.operators.after },
    { value: "is", label: i18n.operators.is },
    { value: "between", label: i18n.operators.between },
    { value: "empty", label: i18n.operators.empty },
    { value: "not_empty", label: i18n.operators.notEmpty },
  ],
});

// Helper function to get operators for a field
const getOperatorsForField = <T = unknown>(
  field: FilterFieldConfig<T>,
  values: FilterOption<T>[],
  i18n: FilterI18nConfig
): FilterOperator[] => {
  if (field.operators) {
    return field.operators;
  }

  const operators = createOperatorsFromI18n(i18n);

  // Determine field type for operator selection
  let fieldType = field.type || "select";

  // If it's a select field but has multiple values, treat as multiselect
  if (fieldType === "select" && values.length > 1) {
    fieldType = "multiselect";
  }

  // If it's a multiselect field or has multiselect operators, use multiselect operators
  if (fieldType === "multiselect" || field.type === "multiselect") {
    return operators.multiselect;
  }

  return operators[fieldType] || operators.select;
};

const createFilter = <T = unknown>(
  field: string,
  operator?: string,
  values: FilterOption<T>[] = []
): Filter<T> => ({
  id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
  field,
  operator: operator || "is",
  values,
});

const createFilterGroup = <T = unknown>(
  id: string,
  label: string,
  fields: FilterFieldConfig<T>[],
  initialFilters: Filter<T>[] = []
): FilterGroup<T> => ({
  id,
  label,
  filters: initialFilters,
  fields,
});

// ─── AI filter wire shapes ───────────────────────────────────────────
//
// Stripped, JSON-safe versions of the filter types used to talk to a
// generic AI filter endpoint. The rich runtime types (icons, async
// loaders, custom renderers, callbacks) are deliberately dropped —
// the model only sees keys, labels, types, operator allowlists, and
// option lists.

interface AIFilterFieldOption {
  label: string;
  value: string;
}

interface AIFilterField {
  description?: string;
  key: string;
  label: string;
  operators?: string[];
  options?: AIFilterFieldOption[];
  type: string;
}

interface AIFilterRule {
  field: string;
  operator: string;
  values: { value: string; label: string }[];
}

const serializeField = <T = unknown>(
  field: FilterFieldConfig<T>
): AIFilterField | null => {
  if (!(field.key && field.label && field.type) || field.type === "separator") {
    return null;
  }

  return {
    key: field.key,
    label: field.label,
    type: field.type,
    operators: field.operators?.map((op) => op.value),
    options: field.options
      ?.map((opt) => {
        if (typeof opt.value === "string" || typeof opt.value === "number") {
          return { value: String(opt.value), label: opt.label };
        }
        return null;
      })
      .filter((o): o is AIFilterFieldOption => o !== null),
  };
};

// Strip a domain's `FilterFieldsConfig` down to the JSON-safe shape
// the AI route accepts. Reuses `flattenFields` so flat and grouped
// configs are handled uniformly.
const serializeFieldsForAI = <T = unknown>(
  fields: FilterFieldsConfig<T>
): AIFilterField[] => {
  const out: AIFilterField[] = [];
  for (const field of flattenFields(fields)) {
    const s = serializeField(field);
    if (s) {
      out.push(s);
    }
  }
  return out;
};

// Convert the FE's runtime Filter shape into the AI rule shape
// (values coerced to strings). Used to send `currentFilters` to the
// AI so it can refine instead of always rebuilding.
const serializeFiltersForAI = <T = unknown>(
  filters: Filter<T>[]
): AIFilterRule[] =>
  filters.map((f) => ({
    field: f.field,
    operator: f.operator,
    values: (f.values ?? []).map((v) => ({
      value:
        typeof v.value === "string" || typeof v.value === "number"
          ? String(v.value)
          : "",
      label: v.label,
    })),
  }));

// ─── Server filter wire shape ────────────────────────────────────────
//
// Shape that hits the BE. Mirrors the FE `Filter` type (one rule per
// `field` + `operator` + `values`) but drops the presentation `id` —
// the BE doesn't care about row keys. `values` keeps the
// `{ value, label }` object shape because it's the source of truth on
// the FE; the BE only reads `value`s, but the `label`s ride along
// without cost. Multi-select operators get the full array; single-
// value operators consume `values[0]` server-side.

interface FilterRuleWire {
  field: string;
  operator: string;
  values: { value: string; label: string }[];
}

// Build the wire payload from the FE's runtime filters. Coerces
// every `values[i].value` to a string so the BE always sees primitive
// strings (numbers come out as `"5"`, dates as ISO). Drops anything
// non-stringable so we never ship a mystery object.
const getFilterQueryBasedOnFilter = <T = unknown>(
  filters: Filter<T>[]
): FilterRuleWire[] =>
  filters.map((f) => ({
    field: f.field,
    operator: f.operator,
    values: (f.values ?? [])
      .map((v) => {
        if (typeof v.value === "string" || typeof v.value === "number") {
          return { value: String(v.value), label: v.label };
        }
        return null;
      })
      .filter((v): v is { value: string; label: string } => v !== null),
  }));

export type {
  AIFilterField,
  AIFilterFieldOption,
  AIFilterRule,
  FilterRuleWire,
};
export {
  createFilter,
  createFilterGroup,
  createOperatorsFromI18n,
  flattenFields,
  getFieldsMap,
  getFilterQueryBasedOnFilter,
  getOperatorsForField,
  isFieldGroup,
  isGroupLevelField,
  serializeFieldsForAI,
  serializeFiltersForAI,
};
