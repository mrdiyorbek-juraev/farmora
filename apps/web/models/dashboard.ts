import { differenceInMonths, parseISO } from "date-fns";
import type { Acquisition, Breed, CattleRow, Gender, Status } from "./cattle";

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

// Lean row for the "Recent additions" widget. Picks only the columns the
// table renders so the dashboard payload stays small. Age is derived
// client-side from `date_of_birth` so the BE doesn't have to recompute on
// every request — the row's own `created_at` ordering is what matters.
export type RecentAdditionItem = Pick<
  CattleRow,
  "id" | "tag_number" | "name" | "breed" | "status" | "date_of_birth" | "created_at"
>;

// Half-open window: `from` inclusive, `to` exclusive. Both ISO date
// strings (YYYY-MM-DD). The dashboard header drives this via preset
// chips — Last 7 days, This month, etc.
export type DashboardDateRange = {
  from: string;
  to: string;
};

// Stable preset keys the header chips emit. The default ("30d") matches
// the most common farmer cadence — looking back about a month.
export const dashboardRangePresets = [
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "this_month", label: "This month" },
  { key: "last_month", label: "Last month" },
  { key: "year", label: "This year" },
  { key: "all", label: "All time" },
] as const;

export type DashboardRangePreset = (typeof dashboardRangePresets)[number]["key"];

// Convert a preset into an actual {from, to} window. `all` returns null
// so callers can skip the filter entirely.
export function resolveDateRange(
  preset: DashboardRangePreset,
  now: Date = new Date()
): DashboardDateRange | null {
  if (preset === "all") {
    return null;
  }
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);

  if (preset === "7d") {
    start.setDate(end.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  } else if (preset === "30d") {
    start.setDate(end.getDate() - 29);
    start.setHours(0, 0, 0, 0);
  } else if (preset === "this_month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else if (preset === "last_month") {
    start.setMonth(end.getMonth() - 1, 1);
    start.setHours(0, 0, 0, 0);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);
  } else {
    // year
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  }

  return { from: start.toISOString(), to: end.toISOString() };
}

export type DashboardMetrics = {
  totalCount: number;
  activeHerdSize: number;
  needsAttention: number;
  avgAgeMonths: number | null;
  byStatus: StatusCount[];
  byBreed: BreedCount[];
  byGender: GenderCount[];
  byAge: AgeBucketCount[];
  recentAdditions: RecentAdditionItem[];
};
