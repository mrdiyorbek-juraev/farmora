import "server-only";

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
  type DashboardMetrics,
  type DashboardMetricsRange,
  type HeadlineCounts,
  isActiveStatus,
  previousRange,
} from "@/models/dashboard";

export type { DashboardMetricsRange };

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

/**
 * Single small projection + JS reduction. Per the dashboard contract,
 * accuracy comes from reading live cattle rows for the active org —
 * never a denormalized snapshot. Swap the body for `db.rpc(...)` if
 * the org grows beyond what this can chew through in a request.
 *
 * When `range` is supplied, only cattle whose `created_at` falls in
 * the window are considered — every aggregate then describes the
 * intake cohort for that window.
 */
type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Read the small projection for one org, optionally scoped to the
 * `created_at` window. Shared by the headline computation and the
 * previous-window comparison so both read rows the same way.
 */
async function fetchCattleRows(
  db: AdminClient,
  organizationId: string,
  range?: DashboardMetricsRange
): Promise<CattleProjection[]> {
  let query = db
    .from("cattle")
    .select("status, gender, breed, acquisition, date_of_birth")
    .eq("organization_id", organizationId);

  if (range?.from) {
    query = query.gte("created_at", range.from);
  }
  if (range?.to) {
    // Push the upper bound to the end of day so a same-day `from`/`to`
    // still captures records created on that day.
    query = query.lte("created_at", `${range.to}T23:59:59.999Z`);
  }

  const { data, error } = await query;

  if (error) {
    throw new DashboardQueryError(error);
  }

  return (data ?? []) as CattleProjection[];
}

/** The three counts the headline cards trend over time. */
function summarizeHeadline(rows: CattleProjection[]): HeadlineCounts {
  let activeHerdSize = 0;
  let needsAttention = 0;
  let pregnantCount = 0;

  for (const row of rows) {
    if (isActiveStatus(row.status)) {
      activeHerdSize += 1;
    }
    if (row.status === "sick") {
      needsAttention += 1;
    }
    if (row.status === "pregnant") {
      pregnantCount += 1;
    }
  }

  return { activeHerdSize, needsAttention, pregnantCount };
}

export async function getDashboardMetrics(
  organizationId: string,
  range?: DashboardMetricsRange
): Promise<DashboardMetrics> {
  const db = createAdminClient();

  const rows = await fetchCattleRows(db, organizationId, range);

  // When the range is bounded, fetch the prior equal-length window so
  // the headline cards can show period-over-period change. A second
  // small projection read is cheap relative to rendering the page.
  const prior = range ? previousRange(range) : null;
  const previous = prior
    ? summarizeHeadline(await fetchCattleRows(db, organizationId, prior))
    : null;

  const byStatus = new Map<Status, number>();
  const byBreed = new Map<Breed, number>();
  const byGender = new Map<Gender, number>();
  const byAge = new Map<AgeBucket, number>();
  // Keyed `${breed}|${bucket}` so we can flatten back to a list at the
  // end without nested maps.
  const byBreedAge = new Map<string, number>();

  let activeHerdSize = 0;
  let needsAttention = 0;
  let pregnantCount = 0;
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
    if (row.status === "pregnant") {
      pregnantCount += 1;
    }

    const bucket = ageBucketForDob(row.date_of_birth, now);
    if (bucket) {
      byAge.set(bucket, (byAge.get(bucket) ?? 0) + 1);
      const key = `${row.breed}|${bucket}`;
      byBreedAge.set(key, (byBreedAge.get(key) ?? 0) + 1);
    }
  }

  return {
    totalCount: rows.length,
    activeHerdSize,
    needsAttention,
    pregnantCount,
    byStatus: Array.from(byStatus, ([status, count]) => ({ status, count })),
    byBreed: Array.from(byBreed, ([breed, count]) => ({ breed, count })),
    byGender: Array.from(byGender, ([gender, count]) => ({ gender, count })),
    byAge: Array.from(byAge, ([bucket, count]) => ({ bucket, count })),
    byBreedAge: Array.from(byBreedAge, ([key, count]) => {
      const [breed, bucket] = key.split("|") as [Breed, AgeBucket];
      return { breed, bucket, count };
    }),
    previous,
  };
}