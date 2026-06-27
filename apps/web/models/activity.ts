import type { Activity } from "@repo/database/types";
import { z } from "zod";

const activityTypeEnum = z.enum([
  "cattle_created",
  "cattle_updated",
  "cattle_deleted",
  "status_changed",
  "weight_recorded",
  "note_added",
  "member_added",
  "member_removed",
  "organization_updated",
]);

export type ActivityType = z.infer<typeof activityTypeEnum>;

export type ActivityRow = Activity;

export const listActivitiesByCattleInputSchema = z.object({
  cattleId: z.uuid(),
  limit: z.number().int().positive().max(200).default(50),
});

export type ListActivitiesByCattleInput = z.input<
  typeof listActivitiesByCattleInputSchema
>;
