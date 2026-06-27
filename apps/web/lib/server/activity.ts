import "server-only";

import { createAdminClient } from "@repo/database/admin";
import type { ActivityInsert, Json } from "@repo/database/types";

import type { ActivityRow, ActivityType } from "@/models/activity";

export class ActivityQueryError extends Error {
  constructor(cause?: unknown) {
    super("Failed to query activities.");
    this.name = "ActivityQueryError";
    this.cause = cause;
  }
}

/**
 * Load the activity feed for a single animal, newest-first. Scoped to
 * the requesting org so we never leak cross-tenant rows even though
 * cattle_id alone would technically narrow the result set.
 */
export async function listActivitiesByCattle(
  organizationId: string,
  cattleId: string,
  limit = 50
): Promise<ActivityRow[]> {
  const db = createAdminClient();

  const { data, error } = await db
    .from("activities")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("cattle_id", cattleId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new ActivityQueryError(error);
  }

  return (data ?? []) as ActivityRow[];
}

export type RecordActivityInput = {
  organizationId: string;
  actorUserId?: string | null;
  cattleId?: string | null;
  type: ActivityType;
  title: string;
  description?: string | null;
  metadata?: Json;
};

/**
 * Append a single row to the activity feed. Activity writes are best-
 * effort — we log on failure but do not throw, because losing an audit
 * row should never roll back the underlying mutation it describes.
 */
export async function recordActivity(input: RecordActivityInput): Promise<void> {
  const db = createAdminClient();
  const row: ActivityInsert = {
    organization_id: input.organizationId,
    actor_user_id: input.actorUserId ?? null,
    cattle_id: input.cattleId ?? null,
    type: input.type,
    title: input.title,
    description: input.description ?? null,
    metadata: input.metadata ?? {},
  };

  const { error } = await db.from("activities").insert(row);
  if (error) {
    // eslint-disable-next-line no-console
    console.error("[activity] failed to record", { type: input.type, error });
  }
}

