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
  isActiveStatus,
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

/**
 * Single small projection + JS reduction. Per the dashboard contract,
 * accuracy comes from reading live cattle rows for the active org —
 * never a denormalized snapshot. Swap the body for `db.rpc(...)` if
 * the org grows beyond what this can chew through in a request.
 */
export async function getDashboardMetrics(
  organizationId: string
): Promise<DashboardMetrics> {
  const db = createAdminClient();

  const { data, error } = await db
    .from("cattle")
    .select("status, gender, breed, acquisition, date_of_birth")
    .eq("organization_id", organizationId);

  if (error) {
    throw new DashboardQueryError(error);
  }

  const rows = (data ?? []) as CattleProjection[];

  const byStatus = new Map<Status, number>();
  const byBreed = new Map<Breed, number>();
  const byGender = new Map<Gender, number>();
  const byAge = new Map<AgeBucket, number>();

  let activeHerdSize = 0;
  let needsAttention = 0;
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
  }

  return {
    totalCount: rows.length,
    activeHerdSize,
    needsAttention,
    byStatus: Array.from(byStatus, ([status, count]) => ({ status, count })),
    byBreed: Array.from(byBreed, ([breed, count]) => ({ breed, count })),
    byGender: Array.from(byGender, ([gender, count]) => ({ gender, count })),
    byAge: Array.from(byAge, ([bucket, count]) => ({ bucket, count })),
  };
}
