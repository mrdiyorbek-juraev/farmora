import "server-only";

import { createAdminClient } from "@repo/database/admin";
import {
  type CattleRow,
  type CattleWithHistory,
  type CreateCattleInput,
  type ListCattleFilters,
  listCattleFiltersSchema,
  type UpdateCattleInput,
} from "@/models/cattle";

export class CattleQueryError extends Error {
  constructor(cause?: unknown) {
    super("Failed to query cattle.");
    this.name = "CattleQueryError";
    this.cause = cause;
  }
}

export class CattleNotFoundError extends Error {
  constructor(id: string) {
    super(`Cattle ${id} not found.`);
    this.name = "CattleNotFoundError";
  }
}

export class CattleDuplicateTagError extends Error {
  constructor(tag: string) {
    super(`Tag number "${tag}" already exists for this organization.`);
    this.name = "CattleDuplicateTagError";
  }
}

const PG_UNIQUE_VIOLATION = "23505";

export async function listCattle(
  organizationId: string,
  rawFilters: ListCattleFilters = {}
): Promise<{ rows: CattleRow[]; total: number }> {
  const filters = listCattleFiltersSchema.parse(rawFilters);
  const db = createAdminClient();

  const sortColumn = filters.sort ?? "created_at";
  const ascending = filters.direction
    ? filters.direction === "asc"
    : false;

  let query = db
    .from("cattle")
    .select("*", { count: "exact" })
    .eq("organization_id", organizationId)
    .order(sortColumn, { ascending });

  // Stable tiebreaker so paginated results are deterministic when
  // multiple rows share the primary sort key.
  if (sortColumn !== "created_at") {
    query = query.order("created_at", { ascending: false });
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.breed) {
    query = query.eq("breed", filters.breed);
  }
  if (filters.gender) {
    query = query.eq("gender", filters.gender);
  }
  if (filters.search) {
    const term = filters.search.replaceAll(",", " ");
    query = query.or(`tag_number.ilike.%${term}%,name.ilike.%${term}%`);
  }

  const { data, error, count } = await query.range(
    filters.offset,
    filters.offset + filters.limit - 1
  );

  if (error) {
    throw new CattleQueryError(error);
  }

  return { rows: data ?? [], total: count ?? 0 };
}

export async function getCattleById(
  organizationId: string,
  id: string
): Promise<CattleWithHistory> {
  const db = createAdminClient();

  const { data, error } = await db
    .from("cattle")
    .select("*, status_history(*)")
    .eq("organization_id", organizationId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new CattleQueryError(error);
  }
  if (!data) {
    throw new CattleNotFoundError(id);
  }

  const history = (data.status_history ?? []).slice().sort((a, b) => {
    return (
      new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
    );
  });

  return { ...data, status_history: history };
}

export async function createCattle(
  organizationId: string,
  createdByUserId: string,
  input: CreateCattleInput
): Promise<CattleRow> {
  const db = createAdminClient();

  const { data, error } = await db
    .from("cattle")
    .insert({
      organization_id: organizationId,
      created_by_user_id: createdByUserId,
      tag_number: input.tag_number,
      name: input.name ?? null,
      breed: input.breed,
      gender: input.gender,
      date_of_birth: input.date_of_birth,
      status: input.status ?? "active",
      weight_kg: input.weight_kg ?? null,
      acquisition: input.acquisition,
      acquired_date: input.acquired_date ?? null,
      notes: input.notes ?? null,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === PG_UNIQUE_VIOLATION) {
      throw new CattleDuplicateTagError(input.tag_number);
    }
    throw new CattleQueryError(error);
  }

  return data;
}

export async function updateCattle(
  organizationId: string,
  changedByUserId: string,
  { id, ...patch }: UpdateCattleInput
): Promise<CattleRow> {
  const db = createAdminClient();

  // Read current row to detect status transitions for history logging
  const current = await db
    .from("cattle")
    .select("status")
    .eq("organization_id", organizationId)
    .eq("id", id)
    .maybeSingle();

  if (current.error) {
    throw new CattleQueryError(current.error);
  }
  if (!current.data) {
    throw new CattleNotFoundError(id);
  }

  const { data, error } = await db
    .from("cattle")
    .update(patch)
    .eq("organization_id", organizationId)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    if (error.code === PG_UNIQUE_VIOLATION) {
      throw new CattleDuplicateTagError(patch.tag_number ?? "");
    }
    throw new CattleQueryError(error);
  }

  if (patch.status && patch.status !== current.data.status) {
    const history = await db.from("status_history").insert({
      cattle_id: id,
      changed_by_user_id: changedByUserId,
      from_status: current.data.status,
      to_status: patch.status,
    });
    if (history.error) {
      throw new CattleQueryError(history.error);
    }
  }

  return data;
}

export async function deleteManyCattle(
  organizationId: string,
  ids: string[]
): Promise<{ ids: string[]; deleted: number }> {
  if (ids.length === 0) {
    return { ids: [], deleted: 0 };
  }
  const db = createAdminClient();

  // Scope every id by organization_id so a stale client-side selection
  // can't reach into another org's cattle. The .in() filter only
  // matches rows that ALSO satisfy the eq() above.
  const { data, error } = await db
    .from("cattle")
    .delete()
    .eq("organization_id", organizationId)
    .in("id", ids)
    .select("id");

  if (error) {
    throw new CattleQueryError(error);
  }

  const deletedIds = (data ?? []).map((row) => row.id);
  return { ids: deletedIds, deleted: deletedIds.length };
}

export async function deleteCattle(
  organizationId: string,
  id: string
): Promise<{ id: string }> {
  const db = createAdminClient();

  const { error, count } = await db
    .from("cattle")
    .delete({ count: "exact" })
    .eq("organization_id", organizationId)
    .eq("id", id);

  if (error) {
    throw new CattleQueryError(error);
  }
  if (!count) {
    throw new CattleNotFoundError(id);
  }

  return { id };
}
