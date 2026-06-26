// i18n Configuration Interface
interface FilterI18nConfig {
  // UI Labels
  addFilter: string;
  addFilterTitle: string;
  defaultColor: string;
  defaultCurrency: string;
  false: string;

  // Helper functions
  helpers: {
    formatOperator: (operator: string) => string;
  };
  max: string;
  min: string;
  noFieldsFound: string;
  noResultsFound: string;

  // Operators
  operators: {
    is: string;
    isNot: string;
    isAnyOf: string;
    isNotAnyOf: string;
    includesAll: string;
    excludesAll: string;
    before: string;
    after: string;
    between: string;
    notBetween: string;
    contains: string;
    notContains: string;
    startsWith: string;
    endsWith: string;
    isExactly: string;
    equals: string;
    notEquals: string;
    greaterThan: string;
    greaterThanOrEqual: string;
    lessThan: string;
    lessThanOrEqual: string;
    overlaps: string;
    includes: string;
    excludes: string;
    includesAllOf: string;
    includesAnyOf: string;
    // Multiselect set-semantics: spec uses "has any/all/none of" rather
    // than overlap/include/exclude wording. Kept alongside the legacy
    // labels so existing consumers don't break.
    hasAnyOf: string;
    hasAllOf: string;
    hasNoneOf: string;
    isWithin: string;
    empty: string;
    notEmpty: string;
  };
  percent: string;

  // Placeholders
  placeholders: {
    enterField: (fieldType: string) => string;
    selectField: string;
    searchField: (fieldName: string) => string;
    enterKey: string;
    enterValue: string;
  };
  searchFields: string;
  select: string;
  selected: string;
  selectedCount: string;
  to: string;
  true: string;
  typeAndPressEnter: string;

  // Validation
  validation: {
    invalidEmail: string;
    invalidUrl: string;
    invalidTel: string;
    invalid: string;
  };
}

// Context for all Filter component props
interface FilterContextValue {
  addButton?: React.ReactNode;
  addButtonClassName?: string;
  addButtonIcon?: React.ReactNode;
  addButtonText?: string;
  className?: string;
  i18n: FilterI18nConfig;
  showAddButton?: boolean;
  showSearchInput?: boolean;
  size: "xs" | "sm" | "default";
  trigger?: React.ReactNode;
}

// Generic types for flexible filter system
interface FilterOption<T = unknown> {
  icon?: React.ReactNode;
  /** Optional image (person avatar / company logo) for entity-style options.
   * Plain string so it stays serializable in persisted filter stores. */
  imageUrl?: string | null;
  label: string;
  metadata?: Record<string, unknown>;
  value: T;
}

interface FilterOperator {
  label: string;
  supportsMultiple?: boolean;
  value: string;
}

// Custom renderer props interface
interface CustomRendererProps<T = unknown> {
  field: FilterFieldConfig<T>;
  onChange: (values: FilterOption<T>[]) => void;
  operator: string;
  values: FilterOption<T>[];
}

// Renders the chip's third section (selected values area) for select /
// multiselect fields. When provided, replaces the default icon-stack +
// label/count display inside the chip trigger. Receives the full field
// config, current values, and current operator so the consumer can
// branch on operator (single vs between) or read field metadata to
// format currency, weeks, avatars, etc.
interface RenderSelectedValuesProps<T = unknown> {
  field: FilterFieldConfig<T>;
  operator: string;
  values: FilterOption<T>[];
}

// Renders a single option row inside the picker dropdown (static or
// async). When provided, replaces the default icon + label display per
// row. Receives the field config (for context), the option being
// rendered, and whether it is currently selected so the consumer can
// style differently for the selected group at the top vs the
// available-options group below.
interface RenderOptionProps<T = unknown> {
  field: FilterFieldConfig<T>;
  isSelected: boolean;
  option: FilterOption<T>;
}

// Grouped field configuration interface
interface FilterFieldGroup<T = unknown> {
  fields: FilterFieldConfig<T>[];
  group?: string;
}

// Union type for both flat and grouped field configurations
type FilterFieldsConfig<T = unknown> =
  | FilterFieldConfig<T>[]
  | FilterFieldGroup<T>[];

interface FilterFieldConfig<T = unknown> {
  allowCustomValues?: boolean;
  // Async-driven options source. If set, overrides `options`.
  async?: FilterAsyncOptions<T>;
  className?: string;
  customRenderer?: (props: CustomRendererProps<T>) => React.ReactNode;
  customValueRenderer?: (
    values: FilterOption<T>[],
    options: FilterOption<T>[]
  ) => React.ReactNode;
  // Default operator to use when creating a filter for this field
  defaultOperator?: string;
  fields?: FilterFieldConfig<T>[];
  // Group-level configuration
  group?: string;
  // Grouping options (legacy support)
  groupLabel?: string;
  icon?: React.ReactNode;
  key?: string;
  label?: string;
  max?: number;
  maxSelections?: number;
  min?: number;
  offLabel?: string;
  // Input event handlers
  onInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  // Boolean field options
  onLabel?: string;
  onValueChange?: (values: FilterOption<T>[]) => void;
  operators?: FilterOperator[];
  // Field-specific options
  options?: FilterOption<T>[];
  pattern?: string;
  placeholder?: string;
  popoverContentClassName?: string;
  prefix?: string | React.ReactNode;
  // Per-option renderer for dropdown rows in static + async pickers.
  // Overrides the default icon + label row. Selected/unselected rows
  // both flow through it — branch on `isSelected` if needed.
  renderOption?: (props: RenderOptionProps<T>) => React.ReactNode;
  // Renderer for the chip's third section (selected values area) on
  // select / multiselect fields. Overrides the default icon-stack +
  // label/count display. Receives the field, current values, and the
  // current operator so the consumer can format chips (e.g. "$1.2M",
  // "12w", avatar + name) and branch on operator (single vs between).
  renderSelectedValues?: (
    props: RenderSelectedValuesProps<T>
  ) => React.ReactNode;
  searchable?: boolean;
  selectedOptionsClassName?: string;
  step?: number;
  suffix?: string | React.ReactNode;
  type?:
    | "select"
    | "multiselect"
    | "date"
    | "daterange"
    | "text"
    | "number"
    | "numberrange"
    | "boolean"
    | "email"
    | "url"
    | "tel"
    | "time"
    | "datetime"
    | "custom"
    | "separator";
  validation?: (value: unknown) => boolean;
  // Controlled values support for this field
  value?: FilterOption<T>[];
  // Number fields only. When the underlying column stores a different
  // unit than the user sees (e.g. cents on the wire / dollars in the
  // UI), set this to the multiplier the popover applies on commit and
  // divides on display. Default 1 (no transform). The chip's custom
  // renderer is responsible for its own display formatting; this only
  // affects the in-popover input.
  wireMultiplier?: number;
}

interface FilterAsyncOptions<T = unknown> {
  debounceMs?: number;
  load: (params: { cursor?: number | string; search: string }) => Promise<{
    nextCursor?: number | string;
    options: FilterOption<T>[];
  }>;
}

interface FilterOperatorDropdownProps<T = unknown> {
  field: FilterFieldConfig<T>;
  onChange: (operator: string) => void;
  operator: string;
  values: FilterOption<T>[];
}

interface FilterValueSelectorProps<T = unknown> {
  field: FilterFieldConfig<T>;
  onChange: (values: FilterOption<T>[]) => void;
  operator: string;
  values: FilterOption<T>[];
}

interface SelectOptionsPopoverProps<T = unknown> {
  field: FilterFieldConfig<T>;
  onBack?: () => void;
  onChange: (values: FilterOption<T>[]) => void;
  onClose?: () => void;
  showBackButton?: boolean;
  values: FilterOption<T>[];
}

interface Filter<T = unknown> {
  field: string;
  id: string;
  operator: string;
  values: FilterOption<T>[];
}

interface FilterGroup<T = unknown> {
  fields: FilterFieldConfig<T>[];
  filters: Filter<T>[];
  id: string;
  label?: string;
}

// FiltersContent component for the filter panel content
interface FiltersContentProps<T = unknown> {
  fields: FilterFieldsConfig<T>;
  filters: Filter<T>[];
  onChange: (filters: Filter<T>[]) => void;
}
interface FiltersProps<T = unknown> {
  addButton?: React.ReactNode;
  addButtonClassName?: string;
  addButtonIcon?: React.ReactNode;
  addButtonText?: string;
  className?: string;
  fields: FilterFieldsConfig<T>;
  filters: Filter<T>[];
  i18n?: Partial<FilterI18nConfig>;
  onChange: (filters: Filter<T>[]) => void;
  onOpenChange?: (open: boolean) => void;
  // Controlled state for the add-filter popover. Both must be
  // provided together; if omitted, the popover is uncontrolled and
  // managed internally. Used by per-page wrappers to wire a keyboard
  // shortcut (e.g. `F`) that opens the picker.
  open?: boolean;
  popoverContentClassName?: string;
  showAddButton?: boolean;
  showSearchInput?: boolean;
  size?: "xs" | "sm" | "default";
  trigger?: React.ReactNode;
}

export type {
  CustomRendererProps,
  Filter,
  FilterAsyncOptions,
  FilterContextValue,
  FilterFieldConfig,
  FilterFieldGroup,
  FilterFieldsConfig,
  FilterGroup,
  FilterI18nConfig,
  FilterOperator,
  FilterOperatorDropdownProps,
  FilterOption,
  FiltersContentProps,
  FiltersProps,
  FilterValueSelectorProps,
  RenderOptionProps,
  RenderSelectedValuesProps,
  SelectOptionsPopoverProps,
};
