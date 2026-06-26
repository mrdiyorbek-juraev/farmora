"use client";

import { useOrganization } from "@repo/auth/client";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { type Dispatch, type SetStateAction, useState } from "react";

import { getCattleAction, listCattleAction } from "@/app/_actions/cattle";
import { PAGE_SIZE } from "@/constants";
import type { ListCattleFilters } from "@/models/cattle";

import { cattleKeys } from "./keys";

// ─── Cattle list ────────────────────────────────────────────────────

type UseCattleListOptions = {
  filters?: Omit<ListCattleFilters, "limit" | "offset">;
};

export const useCattleList = ({ filters }: UseCattleListOptions = {}) => {
  const { organization } = useOrganization();
  const orgId = organization?.id ?? "";
  const [search, setSearch] = useState("");

  const mergedFilters: ListCattleFilters = {
    ...filters,
    search: search.trim() || undefined,
  };

  const cattle = useInfiniteQuery({
    queryKey: cattleKeys.list(orgId, mergedFilters),
    queryFn: ({ pageParam = 0 }) =>
      listCattleAction({
        ...mergedFilters,
        limit: PAGE_SIZE,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce(
        (count, page) => count + page.rows.length,
        0
      );
      if (loaded >= lastPage.total) {
        return undefined;
      }
      return loaded;
    },
    enabled: Boolean(orgId),
  });

  return {
    cattle,
    search: [search, setSearch] as [string, Dispatch<SetStateAction<string>>],
  };
};

// ─── Cattle detail ──────────────────────────────────────────────────

export const useCattleDetail = (cattleId: string) => {
  const { organization } = useOrganization();
  const orgId = organization?.id ?? "";

  const cattle = useQuery({
    queryKey: cattleKeys.detail(orgId, cattleId),
    queryFn: () => getCattleAction({ id: cattleId }),
    enabled: Boolean(orgId) && Boolean(cattleId),
  });

  return { cattle };
};
