"use server";

import { auth } from "@repo/auth/server";
import {
  getCurrentOrganization,
  OrgUnauthenticatedError,
} from "@/lib/server/organization";
import {
  deleteWeight,
  listWeightHistory,
  recordWeight,
  updateWeight,
} from "@/lib/server/weight";
import {
  type DeleteWeightInput,
  deleteWeightInputSchema,
  type ListWeightHistoryInput,
  listWeightHistoryInputSchema,
  type RecordWeightInput,
  recordWeightInputSchema,
  type UpdateWeightInput,
  updateWeightInputSchema,
} from "@/models/weight";

export async function listWeightHistoryAction(
  rawInput: ListWeightHistoryInput
) {
  const { userId } = await auth();
  if (!userId) {
    throw new OrgUnauthenticatedError();
  }
  const { cattle_id } = listWeightHistoryInputSchema.parse(rawInput);
  const { organization } = await getCurrentOrganization();
  return listWeightHistory(organization.id, cattle_id);
}

export async function recordWeightAction(rawInput: RecordWeightInput) {
  const { userId: authedUserId } = await auth();
  if (!authedUserId) {
    throw new OrgUnauthenticatedError();
  }
  const input = recordWeightInputSchema.parse(rawInput);
  const { organization, userId } = await getCurrentOrganization();
  return recordWeight(organization.id, userId, input);
}

export async function updateWeightAction(rawInput: UpdateWeightInput) {
  const { userId } = await auth();
  if (!userId) {
    throw new OrgUnauthenticatedError();
  }
  const input = updateWeightInputSchema.parse(rawInput);
  const { organization } = await getCurrentOrganization();
  return updateWeight(organization.id, input);
}

export async function deleteWeightAction(rawInput: DeleteWeightInput) {
  const { userId } = await auth();
  if (!userId) {
    throw new OrgUnauthenticatedError();
  }
  const { id } = deleteWeightInputSchema.parse(rawInput);
  const { organization } = await getCurrentOrganization();
  return deleteWeight(organization.id, id);
}
