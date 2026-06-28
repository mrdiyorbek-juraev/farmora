// Static option lists for cattle form selects. Values mirror the Zod enums
// in `models/cattle.ts` one-to-one — update both together if an enum value
// changes.

interface CattleOption {
  label: string;
  value: string;
}

export const BREED_OPTIONS: CattleOption[] = [
  { value: "holstein", label: "Holstein" },
  { value: "jersey", label: "Jersey" },
  { value: "angus", label: "Angus" },
  { value: "hereford", label: "Hereford" },
  { value: "brown_swiss", label: "Brown Swiss" },
  { value: "guernsey", label: "Guernsey" },
  { value: "charolais", label: "Charolais" },
  { value: "simmental", label: "Simmental" },
  { value: "other", label: "Other" },
];

export const GENDER_OPTIONS: CattleOption[] = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
];

export const STATUS_OPTIONS: CattleOption[] = [
  { value: "active", label: "Active" },
  { value: "sick", label: "Sick" },
  { value: "pregnant", label: "Pregnant" },
  { value: "sold", label: "Sold" },
  { value: "deceased", label: "Deceased" },
];

export const ACQUISITION_OPTIONS: CattleOption[] = [
  { value: "born_on_farm", label: "Born on farm" },
  { value: "purchased", label: "Purchased" },
];
