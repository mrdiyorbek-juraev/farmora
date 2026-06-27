"use server";

import { listActivitiesByCattle } from "@/lib/server/activity";
import { getCurrentOrganization } from "@/lib/server/organization";
import {
  type ListActivitiesByCattleInput,
  listActivitiesByCattleInputSchema,
} from "@/models/activity";

export async function listActivitiesByCattleAction(
  rawInput: ListActivitiesByCattleInput
) {
  const input = listActivitiesByCattleInputSchema.parse(rawInput);
  const { organization } = await getCurrentOrganization();
  return listActivitiesByCattle(organization.id, input.cattleId, input.limit);
}
