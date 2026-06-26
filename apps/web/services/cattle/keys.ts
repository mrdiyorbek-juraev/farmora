import type { ListCattleFilters } from "@/models/cattle";

export const cattleKeys = {
  all: (orgId: string) => [`${orgId}/CATTLE`] as const,
  list: (orgId: string, filters: ListCattleFilters) =>
    [`${orgId}/CATTLE`, "LIST", filters] as const,
  detail: (orgId: string, cattleId: string) =>
    [`${orgId}/CATTLE`, cattleId] as const,
} as const;
