import { differenceInMonths, parseISO } from "date-fns";
import type { Acquisition, Breed, Gender, Status } from "./cattle";

export type AgeBucket = "calf" | "young" | "adult" | "mature";

export const ageBucketLabels: Record<AgeBucket, string> = {
  calf: "Calf",
  young: "Young",
  adult: "Adult",
  mature: "Mature",
};

// Standard cattle breeding chart:
//   Calf   < 6 mo
//   Young  6 mo – 1 yr
//   Adult  1 – 5 yr
//   Mature 5+ yr
export function bucketForAgeMonths(months: number): AgeBucket {
  if (months < 6) {
    return "calf";
  }
  if (months < 12) {
    return "young";
  }
  if (months < 60) {
    return "adult";
  }
  return "mature";
}

export function ageBucketForDob(
  dob: string | null | undefined,
  now: Date = new Date()
): AgeBucket | null {
  if (!dob) {
    return null;
  }
  const parsed = parseISO(dob);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  const months = differenceInMonths(now, parsed);
  if (months < 0) {
    return null;
  }
  return bucketForAgeMonths(months);
}

// "Active" excludes terminal statuses — matches the design doc's
// "Active herd size" definition.
const TERMINAL_STATUSES: ReadonlySet<Status> = new Set(["sold", "deceased"]);

export function isActiveStatus(status: Status): boolean {
  return !TERMINAL_STATUSES.has(status);
}

// ─── Aggregated payload ────────────────────────────────────────────

export type StatusCount = { status: Status; count: number };
export type BreedCount = { breed: Breed; count: number };
export type GenderCount = { gender: Gender; count: number };
export type AcquisitionCount = { acquisition: Acquisition; count: number };
export type AgeBucketCount = { bucket: AgeBucket; count: number };

export type DashboardMetrics = {
  totalCount: number;
  activeHerdSize: number;
  needsAttention: number;
  byStatus: StatusCount[];
  byBreed: BreedCount[];
  byGender: GenderCount[];
  byAge: AgeBucketCount[];
};
