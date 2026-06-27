import {
  differenceInCalendarDays,
  differenceInMonths,
  format,
  parseISO,
  subDays,
} from "date-fns";
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
export type BreedAgeCount = { breed: Breed; bucket: AgeBucket; count: number };

export type DashboardMetricsRange = {
  /** Inclusive lower bound, ISO date string (YYYY-MM-DD). */
  from?: string;
  /** Inclusive upper bound, ISO date string (YYYY-MM-DD). */
  to?: string;
};

// The three headline counts a farmer acts on. We carry the prior
// window's values so the cards can show period-over-period change —
// a count plus its trend is decision-support; a count alone is not.
export type HeadlineCounts = {
  activeHerdSize: number;
  needsAttention: number;
  pregnantCount: number;
};

/**
 * The equal-length window immediately preceding `range`, so a 90-day
 * view compares against the prior 90 days. Returns null when the range
 * is open-ended (no baseline to compare against) or unparseable.
 */
export function previousRange(
  range: DashboardMetricsRange
): DashboardMetricsRange | null {
  if (!(range.from && range.to)) {
    return null;
  }
  const from = parseISO(range.from);
  const to = parseISO(range.to);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return null;
  }
  // Inclusive window spans `spanDays + 1` calendar days; the prior
  // window ends the day before `from` and is the same length.
  const spanDays = differenceInCalendarDays(to, from);
  const prevTo = subDays(from, 1);
  const prevFrom = subDays(prevTo, spanDays);
  return {
    from: format(prevFrom, "yyyy-MM-dd"),
    to: format(prevTo, "yyyy-MM-dd"),
  };
}

export type DashboardMetrics = {
  totalCount: number;
  activeHerdSize: number;
  needsAttention: number;
  pregnantCount: number;
  byStatus: StatusCount[];
  byBreed: BreedCount[];
  byGender: GenderCount[];
  byAge: AgeBucketCount[];
  byBreedAge: BreedAgeCount[];
  /** Headline counts for the preceding equal-length window, or null
   * when the range is open-ended and no baseline exists. */
  previous: HeadlineCounts | null;
};
