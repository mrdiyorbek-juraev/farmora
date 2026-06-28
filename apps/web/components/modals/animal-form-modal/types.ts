export type TagAvailability =
  | "idle"
  | "checking"
  | "available"
  | "taken"
  | "error";

export interface SelectOption {
  label: string;
  value: string;
}
