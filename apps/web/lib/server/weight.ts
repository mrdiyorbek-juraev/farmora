import "server-only";

import { createAdminClient } from "@repo/database/admin";
import type { WeightMeasurementInsert } from "@repo/database/types";
import type {
  RecordWeightInput,
  WeightMeasurementRow,
  WeightMeasurementWithGain,
} from "@/models/weight";

import { recordActivity } from "./activity";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function describeCattle(row: { tag_number: string; name: string | null }) {
  return row.name ? `${row.name} (#${row.tag_number})` : `#${row.tag_number}`;
}

class WeightQueryError extends Error {
  constructor(cause?: unknown) {
    super("Failed to query weight measurements.");
    this.name = "WeightQueryError";
    this.cause = cause;
  }
}

class WeightCattleNotFoundError extends Error {
  constructor(id: string) {
    super(`Cattle ${id} not found.`);
    this.name = "WeightCattleNotFoundError";
  }
}

class WeightNotFoundError extends Error {
  constructor(id: string) {
    super(`Weight measurement ${id} not found.`);
    this.name = "WeightNotFoundError";
  }
}

/**
 * Average daily gain between two consecutive measurements: the change in
 * weight divided by the number of days elapsed. Returns `null` when the
 * two points share a date (no elapsed time to divide by).
 */
function dailyGain(
  current: WeightMeasurementRow,
  previous: WeightMeasurementRow
): number | null {
  const days =
    (new Date(current.measured_at).getTime() -
      new Date(previous.measured_at).getTime()) /
    MS_PER_DAY;
  if (days <= 0) {
    return null;
  }
  return (current.weight_kg - previous.weight_kg) / days;
}

/**
 * Load an animal's full weight series, oldest-first, with the average
 * daily gain since the previous point attached to each row. Ascending
 * order drives the chart directly; the table can reverse for newest-
 * first display. Scoped to the org so we never leak cross-tenant rows.
 */
export async function listWeightHistory(
  organizationId: string,
  cattleId: string
): Promise<WeightMeasurementWithGain[]> {
  const db = createAdminClient();

  const { data, error } = await db
    .from("weight_measurements")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("cattle_id", cattleId)
    .order("measured_at", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new WeightQueryError(error);
  }

  const rows = data ?? [];
  const result: WeightMeasurementWithGain[] = [];
  for (let i = 0; i < rows.length; i++) {
    const previous = i > 0 ? rows[i - 1] : null;
    result.push({
      ...rows[i],
      average_daily_gain_kg: previous ? dailyGain(rows[i], previous) : null,
    });
  }
  return result;
}

/**
 * Fetch the animal's most recent measurement (latest `measured_at`,
 * breaking ties on insert order) so the denormalized current-weight
 * cache on `cattle` can be kept in sync after a record/delete.
 */
async function latestWeight(
  db: ReturnType<typeof createAdminClient>,
  organizationId: string,
  cattleId: string
): Promise<number | null> {
  const { data, error } = await db
    .from("weight_measurements")
    .select("weight_kg")
    .eq("organization_id", organizationId)
    .eq("cattle_id", cattleId)
    .order("measured_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new WeightQueryError(error);
  }
  return data?.weight_kg ?? null;
}

async function syncCurrentWeight(
  db: ReturnType<typeof createAdminClient>,
  organizationId: string,
  cattleId: string
): Promise<void> {
  const weight = await latestWeight(db, organizationId, cattleId);
  const { error } = await db
    .from("cattle")
    .update({ weight_kg: weight })
    .eq("organization_id", organizationId)
    .eq("id", cattleId);
  if (error) {
    throw new WeightQueryError(error);
  }
}

/**
 * Record a new weight measurement for an animal, refresh the animal's
 * denormalized current weight, and append a `weight_recorded` activity.
 */
export async function recordWeight(
  organizationId: string,
  recordedByUserId: string,
  input: RecordWeightInput
): Promise<WeightMeasurementRow> {
  const db = createAdminClient();

  // Verify the animal belongs to the caller's org before writing — an
  // org-scoped lookup means a stale/forged cattle_id can't attach a
  // measurement to another tenant's animal.
  const cattle = await db
    .from("cattle")
    .select("id, tag_number, name")
    .eq("organization_id", organizationId)
    .eq("id", input.cattle_id)
    .maybeSingle();

  if (cattle.error) {
    throw new WeightQueryError(cattle.error);
  }
  if (!cattle.data) {
    throw new WeightCattleNotFoundError(input.cattle_id);
  }
  const animal = cattle.data;

  const insert: WeightMeasurementInsert = {
    organization_id: organizationId,
    cattle_id: input.cattle_id,
    recorded_by_user_id: recordedByUserId,
    weight_kg: input.weight_kg,
    measured_at: input.measured_at,
    note: input.note ?? null,
  };

  const { data, error } = await db
    .from("weight_measurements")
    .insert(insert)
    .select("*")
    .single();

  if (error) {
    throw new WeightQueryError(error);
  }

  await syncCurrentWeight(db, organizationId, input.cattle_id);

  await recordActivity({
    organizationId,
    actorUserId: recordedByUserId,
    cattleId: input.cattle_id,
    type: "weight_recorded",
    title: `${describeCattle(animal)} weighed ${input.weight_kg} kg`,
    metadata: {
      tag: animal.tag_number,
      weight_kg: input.weight_kg,
      measured_at: input.measured_at,
    },
  });

  return data;
}

/**
 * Delete a single weight measurement and re-sync the animal's current
 * weight from whatever remains (null if it was the last one).
 */
export async function deleteWeight(
  organizationId: string,
  id: string
): Promise<{ id: string; cattle_id: string }> {
  const db = createAdminClient();

  // Need the cattle_id to know which animal's cache to recompute, and
  // the org-scoped read doubles as the tenancy check before deleting.
  const existing = await db
    .from("weight_measurements")
    .select("cattle_id")
    .eq("organization_id", organizationId)
    .eq("id", id)
    .maybeSingle();

  if (existing.error) {
    throw new WeightQueryError(existing.error);
  }
  if (!existing.data) {
    throw new WeightNotFoundError(id);
  }
  const cattleId = existing.data.cattle_id;

  const { error } = await db
    .from("weight_measurements")
    .delete()
    .eq("organization_id", organizationId)
    .eq("id", id);

  if (error) {
    throw new WeightQueryError(error);
  }

  await syncCurrentWeight(db, organizationId, cattleId);

  return { id, cattle_id: cattleId };
}
