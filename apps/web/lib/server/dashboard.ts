import "server-only";

import { differenceInMonths, parseISO } from "date-fns";
import { createAdminClient } from "@repo/database/admin";
import type {
  Acquisition,
  Breed,
  Gender,
  Status,
} from "@/models/cattle";
import {
  type AgeBucket,
  ageBucketForDob,
  type DashboardDateRange,
  type DashboardMetrics,
  isActiveStatus,
  type RecentAdditionItem,
} from "@/models/dashboard";

export class DashboardQueryError extends Error {
  constructor(cause?: unknown) {
    super("Failed to compute dashboard metrics.");
    this.name = "DashboardQueryError";
    this.cause = cause;
  }
}

type CattleProjection = {
  status: Status;
  gender: Gender;
  breed: Breed;
  acquisition: Acquisition;
  date_of_birth: string | null;
};

const RECENT_ADDITIONS_LIMIT = 6;

/**
 * Single small projection + JS reduction. Per the dashboard contract,
 * accuracy comes from reading live cattle rows for the active org —
 * never a denormalized snapshot. Swap the body for `db.rpc(...)` if
 * the org grows beyond what this can chew through in a request.
 *
 * The aggregate metrics (Total / Active / Needs attention / Avg age /
 * by-status / by-breed / by-gender / by-age) are always "current state"
 * regardless of `dateRange`. Only the recent-additions table is scoped
 * to the window — those numbers describe activity, not herd composition.
 */
export async function getDashboardMetrics(
  organizationId: string,
  dateRange?: DashboardDateRange | null
): Promise<DashboardMetrics> {
  const db = createAdminClient();

  // Run both reads in parallel — the aggregate projection and the recent
  // additions list don't depend on each other.
  const aggregatePromise = db
    .from("cattle")
    .select("status, gender, breed, acquisition, date_of_birth")
    .eq("organization_id", organizationId);

  let recentQuery = db
    .from("cattle")
    .select(
      "id, tag_number, name, breed, status, date_of_birth, created_at"
    )
    .eq("organization_id", organizationId);

  if (dateRange) {
    recentQuery = recentQuery
      .gte("created_at", dateRange.from)
      .lte("created_at", dateRange.to);
  }

  const recentPromise = recentQuery
    .order("created_at", { ascending: false })
    .limit(RECENT_ADDITIONS_LIMIT);

  const [aggregate, recent] = await Promise.all([
    aggregatePromise,
    recentPromise,
  ]);

  if (aggregate.error) {
    throw new DashboardQueryError(aggregate.error);
  }
  if (recent.error) {
    throw new DashboardQueryError(recent.error);
  }

  const rows = (aggregate.data ?? []) as CattleProjection[];

  const byStatus = new Map<Status, number>();
  const byBreed = new Map<Breed, number>();
  const byGender = new Map<Gender, number>();
  const byAge = new Map<AgeBucket, number>();

  let activeHerdSize = 0;
  let needsAttention = 0;
  let ageMonthsSum = 0;
  let ageMonthsCount = 0;
  const now = new Date();

  for (const row of rows) {
    byStatus.set(row.status, (byStatus.get(row.status) ?? 0) + 1);
    byBreed.set(row.breed, (byBreed.get(row.breed) ?? 0) + 1);
    byGender.set(row.gender, (byGender.get(row.gender) ?? 0) + 1);

    if (isActiveStatus(row.status)) {
      activeHerdSize += 1;
    }
    if (row.status === "sick") {
      needsAttention += 1;
    }

    const bucket = ageBucketForDob(row.date_of_birth, now);
    if (bucket) {
      byAge.set(bucket, (byAge.get(bucket) ?? 0) + 1);
    }

    // Avg age across rows that have a valid DOB AND are still in the herd.
    // Excluding sold/deceased gives the farmer a meaningful "how old is my
    // active herd" number rather than a number skewed by archived rows.
    if (row.date_of_birth && isActiveStatus(row.status)) {
      const parsed = parseISO(row.date_of_birth);
      if (!Number.isNaN(parsed.getTime())) {
        const months = differenceInMonths(now, parsed);
        if (months >= 0) {
          ageMonthsSum += months;
          ageMonthsCount += 1;
        }
      }
    }
  }

  const avgAgeMonths =
    ageMonthsCount > 0 ? Math.round(ageMonthsSum / ageMonthsCount) : null;

  return {
    totalCount: rows.length,
    activeHerdSize,
    needsAttention,
    avgAgeMonths,
    byStatus: Array.from(byStatus, ([status, count]) => ({ status, count })),
    byBreed: Array.from(byBreed, ([breed, count]) => ({ breed, count })),
    byGender: Array.from(byGender, ([gender, count]) => ({ gender, count })),
    byAge: Array.from(byAge, ([bucket, count]) => ({ bucket, count })),
    recentAdditions: (recent.data ?? []) as RecentAdditionItem[],
  };
}
