"use server";

import {
  createCattle,
  deleteCattle,
  deleteManyCattle,
  generateCattleTag,
  getCattleById,
  isCattleTagAvailable,
  listCattle,
  updateCattle,
} from "@/lib/server/cattle";
import { getCurrentOrganization } from "@/lib/server/organization";
import {
  type CheckTagAvailableInput,
  checkTagAvailableInputSchema,
  type CreateCattleInput,
  createCattleInputSchema,
  type DeleteCattleInput,
  deleteCattleInputSchema,
  type DeleteManyCattleInput,
  deleteManyCattleInputSchema,
  getCattleByIdInputSchema,
  type ListCattleFilters,
  listCattleFiltersSchema,
  type UpdateCattleInput,
  updateCattleInputSchema,
} from "@/models/cattle";

export async function listCattleAction(rawFilters: ListCattleFilters = {}) {
  const filters = listCattleFiltersSchema.parse(rawFilters);
  const { organization } = await getCurrentOrganization();
  return listCattle(organization.id, filters);
}

export async function getCattleAction(rawInput: { id: string }) {
  const { id } = getCattleByIdInputSchema.parse(rawInput);
  const { organization } = await getCurrentOrganization();
  return getCattleById(organization.id, id);
}

export async function createCattleAction(rawInput: CreateCattleInput) {
  const input = createCattleInputSchema.parse(rawInput);
  const { organization, userId } = await getCurrentOrganization();
  return createCattle(organization.id, userId, input);
}

export async function updateCattleAction(rawInput: UpdateCattleInput) {
  const input = updateCattleInputSchema.parse(rawInput);
  const { organization, userId } = await getCurrentOrganization();
  return updateCattle(organization.id, userId, input);
}

export async function deleteCattleAction(rawInput: DeleteCattleInput) {
  const { id } = deleteCattleInputSchema.parse(rawInput);
  const { organization } = await getCurrentOrganization();
  return deleteCattle(organization.id, id);
}

export async function deleteManyCattleAction(rawInput: DeleteManyCattleInput) {
  const { ids } = deleteManyCattleInputSchema.parse(rawInput);
  const { organization } = await getCurrentOrganization();
  return deleteManyCattle(organization.id, ids);
}

export async function checkCattleTagAvailableAction(
  rawInput: CheckTagAvailableInput
) {
  const input = checkTagAvailableInputSchema.parse(rawInput);
  const { organization } = await getCurrentOrganization();
  const available = await isCattleTagAvailable(
    organization.id,
    input.tag_number,
    input.exclude_id
  );
  return { available };
}

export async function generateCattleTagAction() {
  const { organization } = await getCurrentOrganization();
  const tag = await generateCattleTag(organization.id);
  return { tag };
}
