import type { ReactNode } from "react";

import type { CattleWithHistory } from "@/models/cattle";

export interface AnimalHeaderProps {
  animal: CattleWithHistory;
}

export interface AnimalSubHeaderProps {
  animal: CattleWithHistory;
}

export interface AnimalMainContentProps {
  animal: CattleWithHistory;
}

export interface AnimalRecordDetailsProps {
  animal: CattleWithHistory;
}

export interface ActivityLogProps {
  cattleId: string;
}

export interface EditableTextRowProps {
  icon: ReactNode;
  label: string;
  value: string;
  placeholder?: string;
  maxLength?: number;
  /** Set true to surface the value as a monospace tabular number block. */
  tabular?: boolean;
  className?: string;
  onSave: (next: string) => void | Promise<unknown>;
}

export interface EditableSelectOption {
  value: string;
  label: string;
}

export interface EditableSelectRowProps {
  icon: ReactNode;
  label: string;
  value: string;
  options: EditableSelectOption[];
  placeholder?: string;
  /** Render the current value as anything (Badge, plain text, etc.). */
  renderValue?: (value: string) => ReactNode;
  onSave: (next: string) => void | Promise<unknown>;
}

export interface EditableDateRowProps {
  icon: ReactNode;
  label: string;
  /** ISO date string `YYYY-MM-DD` or null/empty for "not set". */
  value: string | null;
  placeholder?: string;
  disableFuture?: boolean;
  /** When true, clicking the cell while a date is set offers a clear icon. */
  clearable?: boolean;
  onSave: (next: string | null) => void | Promise<unknown>;
}
