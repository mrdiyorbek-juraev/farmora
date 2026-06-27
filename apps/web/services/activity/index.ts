"use client";

import { useOrganization } from "@repo/auth/client";
import { useQuery } from "@tanstack/react-query";

import { listActivitiesByCattleAction } from "@/app/_actions/activity";

import { activityKeys } from "./keys";

export const useCattleActivity = (cattleId: string) => {
  const { organization } = useOrganization();
  const orgId = organization?.id ?? "";

  const activity = useQuery({
    queryKey: activityKeys.byCattle(orgId, cattleId),
    queryFn: () =>
      listActivitiesByCattleAction({ cattleId, limit: 100 }),
    enabled: Boolean(orgId) && Boolean(cattleId),
    staleTime: 30_000,
  });

  return { activity };
};
