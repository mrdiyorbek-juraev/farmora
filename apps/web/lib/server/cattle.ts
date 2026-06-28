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

import { recordActivity } from "./activity";

function describeCattle(row: { tag_number: string; name: string | null }) {
  return row.name ? `${row.name} (#${row.tag_number})` : `#${row.tag_number}`;
}

class CattleQueryError extends Error {
  constructor(cause?: unknown) {
    super("Failed to query cattle.");
    this.name = "CattleQueryError";
    this.cause = cause;
  }
}

class CattleNotFoundError extends Error {
  // Keep the id for server-side logs, but the user-facing message omits
  // it — leaking internal UUIDs in a toast is needless information
  // disclosure (and the id means nothing to a farmer).
  readonly cattleId: string;
  constructor(id: string) {
    super("This animal no longer exists.");
    this.name = "CattleNotFoundError";
    this.cattleId = id;
  }
}

class CattleDuplicateTagError extends Error {
  constructor(tag: string) {
    super(`Tag number "${tag}" already exists for this organization.`);
    this.name = "CattleDuplicateTagError";
  }
}

const PG_UNIQUE_VIOLATION = "23505";

// Neutralize characters that have structural meaning inside a PostgREST
// filter expression before interpolating a user-supplied term into an
// `.or()` string. Commas separate OR clauses; parentheses open/close
// groups; backslash, percent and underscore are LIKE metacharacters. We
// strip the structural ones and escape the LIKE wildcards so the term can
// only ever match literally — it can never inject extra filter clauses.
function escapePostgrestLikeTerm(raw: string): string {
  return raw
    .replaceAll("\\", "")
    .replaceAll(",", " ")
    .replaceAll("(", " ")
    .replaceAll(")", " ")
    .replaceAll("*", " ")
    .replaceAll("%", " ")
    .replaceAll("_", " ");
}

export async function listCattle(
  organizationId: string,
  rawFilters: ListCattleFilters = {}
): Promise<{ rows: CattleRow[]; total: number }> {
  const filters = listCattleFiltersSchema.parse(rawFilters);
  const db = createAdminClient();

  const sortColumn = filters.sort ?? "created_at";
  const ascending = filters.direction ? filters.direction === "asc" : false;

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
    const term = escapePostgrestLikeTerm(filters.search);
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
    return new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime();
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

  // Seed the weight history with the creation weight so it's the first
  // point on the chart and the denormalized cattle.weight_kg cache is
  // backed by a real measurement. Dated today (the registration date).
  if (input.weight_kg != null) {
    const measuredAt = new Date().toISOString().slice(0, 10);
    const seed = await db.from("weight_measurements").insert({
      organization_id: organizationId,
      cattle_id: data.id,
      recorded_by_user_id: createdByUserId,
      weight_kg: input.weight_kg,
      measured_at: measuredAt,
      is_initial: true,
    });
    if (seed.error) {
      throw new CattleQueryError(seed.error);
    }
  }

  await recordActivity({
    organizationId,
    actorUserId: createdByUserId,
    cattleId: data.id,
    type: "cattle_created",
    title: `Added ${describeCattle(data)} to the herd`,
    metadata: {
      tag: data.tag_number,
      name: data.name,
      breed: data.breed,
      gender: data.gender,
      status: data.status,
    },
  });

  return data;
}

export async function isCattleTagAvailable(
  organizationId: string,
  tagNumber: string,
  excludeId?: string
): Promise<boolean> {
  const db = createAdminClient();

  let query = db
    .from("cattle")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("tag_number", tagNumber);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { count, error } = await query;

  if (error) {
    throw new CattleQueryError(error);
  }

  return (count ?? 0) === 0;
}

// USDA AIN-style: 15 digits = "840" country prefix + 12-digit unique animal
// id. We mimic the visual format (`840-XXX-XXXX-XXXX`) but the suffix is a
// per-org running sequence, not a registered AIN. Only this function ever
// produces 840-prefixed tags, so the lookup below is the source of truth
// for "next" — farmer-typed tags in other formats are ignored entirely.
export async function generateCattleTag(
  organizationId: string
): Promise<string> {
  const db = createAdminClient();

  // Bound the scan: newest tags first so the running max is in this
  // window, and cap the payload so a large herd can't make tag
  // generation linearly slower over time. A per-org sequence is the
  // O(1) long-term fix if herds outgrow this.
  const { data, error } = await db
    .from("cattle")
    .select("tag_number")
    .eq("organization_id", organizationId)
    .like("tag_number", "840-%")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    throw new CattleQueryError(error);
  }

  let max = 0;
  for (const { tag_number } of data ?? []) {
    const digits = tag_number.replaceAll("-", "");
    if (digits.length === 15 && digits.startsWith("840")) {
      const n = Number(digits.slice(3));
      if (Number.isFinite(n) && n > max) {
        max = n;
      }
    }
  }

  const next = String(max + 1).padStart(12, "0");
  return `840-${next.slice(0, 3)}-${next.slice(3, 7)}-${next.slice(7, 12)}`;
}

export async function updateCattle(
  organizationId: string,
  changedByUserId: string,
  { id, ...patch }: UpdateCattleInput
): Promise<CattleRow> {
  const db = createAdminClient();

  // Read the current row so we can diff against the patch — needed both
  // for status_history (audit of the transition) and for the activity
  // feed (so a generic "updated" entry can list which fields changed).
  const current = await db
    .from("cattle")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", id)
    .maybeSingle();

  if (current.error) {
    throw new CattleQueryError(current.error);
  }
  if (!current.data) {
    throw new CattleNotFoundError(id);
  }
  // Hoist into a const so TS keeps the non-null narrowing past the
  // subsequent await — `current.data` widens back to nullable through
  // the property access otherwise.
  const before = current.data;

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

  const statusChanged = Boolean(patch.status) && patch.status !== before.status;

  if (statusChanged && patch.status) {
    const history = await db.from("status_history").insert({
      cattle_id: id,
      changed_by_user_id: changedByUserId,
      from_status: before.status,
      to_status: patch.status,
    });
    if (history.error) {
      throw new CattleQueryError(history.error);
    }

    await recordActivity({
      organizationId,
      actorUserId: changedByUserId,
      cattleId: id,
      type: "status_changed",
      title: `${describeCattle(data)} marked ${patch.status}`,
      metadata: {
        tag: data.tag_number,
        from: before.status,
        to: patch.status,
      },
    });
  }

  // Compute which non-status fields actually changed so the generic
  // "updated" entry is informative and isn't logged for no-op saves.
  const trackedFields = [
    "tag_number",
    "name",
    "breed",
    "gender",
    "date_of_birth",
    "weight_kg",
    "acquisition",
    "acquired_date",
    "notes",
  ] as const;
  const changedFields = trackedFields.filter(
    (field) => patch[field] !== undefined && patch[field] !== before[field]
  );

  if (changedFields.length > 0) {
    await recordActivity({
      organizationId,
      actorUserId: changedByUserId,
      cattleId: id,
      type: "cattle_updated",
      title: `${describeCattle(data)} updated`,
      description:
        changedFields.length === 1
          ? `Changed ${changedFields[0]}.`
          : `Changed ${changedFields.length} fields.`,
      metadata: {
        tag: data.tag_number,
        fields: changedFields,
      },
    });
  }

  return data;
}

export async function deleteManyCattle(
  organizationId: string,
  deletedByUserId: string,
  ids: string[]
): Promise<{ ids: string[]; deleted: number }> {
  if (ids.length === 0) {
    return { ids: [], deleted: 0 };
  }
  const db = createAdminClient();

  // Snapshot tag/name before the delete so the activity rows survive
  // the FK set-null and still describe what was removed.
  const snapshot = await db
    .from("cattle")
    .select("id, tag_number, name")
    .eq("organization_id", organizationId)
    .in("id", ids);
  if (snapshot.error) {
    throw new CattleQueryError(snapshot.error);
  }

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

  const deletedIds = new Set((data ?? []).map((row) => row.id));
  const deletedRows = (snapshot.data ?? []).filter((row) =>
    deletedIds.has(row.id)
  );

  await Promise.all(
    deletedRows.map((row) =>
      recordActivity({
        organizationId,
        actorUserId: deletedByUserId,
        // cattle_id is null since the row is gone; the tag lives in metadata.
        cattleId: null,
        type: "cattle_deleted",
        title: `Removed ${describeCattle(row)} from the herd`,
        metadata: { tag: row.tag_number, name: row.name },
      })
    )
  );

  return { ids: Array.from(deletedIds), deleted: deletedIds.size };
}

export async function deleteCattle(
  organizationId: string,
  deletedByUserId: string,
  id: string
): Promise<{ id: string }> {
  const db = createAdminClient();

  // Snapshot the human-readable identifier first so the activity row
  // still has the tag after the cattle row is gone.
  const snapshot = await db
    .from("cattle")
    .select("tag_number, name")
    .eq("organization_id", organizationId)
    .eq("id", id)
    .maybeSingle();
  if (snapshot.error) {
    throw new CattleQueryError(snapshot.error);
  }

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

  if (snapshot.data) {
    await recordActivity({
      organizationId,
      actorUserId: deletedByUserId,
      cattleId: null,
      type: "cattle_deleted",
      title: `Removed ${describeCattle(snapshot.data)} from the herd`,
      metadata: { tag: snapshot.data.tag_number, name: snapshot.data.name },
    });
  }

  return { id };
}
