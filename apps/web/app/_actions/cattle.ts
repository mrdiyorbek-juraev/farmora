"use server";

import {
  createCattle,
  deleteCattle,
  deleteManyCattle,
  getCattleById,
  listCattle,
  updateCattle,
} from "@/lib/server/cattle";
import { getCurrentOrganization } from "@/lib/server/organization";
import {
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
  const { organization, userId } = await getCurrentOrganization();
  return deleteCattle(organization.id, userId, id);
}

export async function deleteManyCattleAction(rawInput: DeleteManyCattleInput) {
  const { ids } = deleteManyCattleInputSchema.parse(rawInput);
  const { organization, userId } = await getCurrentOrganization();
  return deleteManyCattle(organization.id, userId, ids);
}
