"use server";

import { auth } from "@repo/auth/server";
import { listActivitiesByCattle } from "@/lib/server/activity";
import {
  getCurrentOrganization,
  OrgUnauthenticatedError,
} from "@/lib/server/organization";
import {
  type ListActivitiesByCattleInput,
  listActivitiesByCattleInputSchema,
} from "@/models/activity";

export async function listActivitiesByCattleAction(
  rawInput: ListActivitiesByCattleInput
) {
  const { userId } = await auth();
  if (!userId) {
    throw new OrgUnauthenticatedError();
  }
  const input = listActivitiesByCattleInputSchema.parse(rawInput);
  const { organization } = await getCurrentOrganization();
  return listActivitiesByCattle(organization.id, input.cattleId, input.limit);
}
