"use client";

import { useOrganization } from "@repo/auth/client";
import { useQuery } from "@tanstack/react-query";

import { listWeightHistoryAction } from "@/app/_actions/weight";

import { weightKeys } from "./keys";

// ─── Weight history ─────────────────────────────────────────────────

export const useCattleWeightHistory = (cattleId: string) => {
  const { organization } = useOrganization();
  const orgId = organization?.id ?? "";

  const weightHistory = useQuery({
    queryKey: weightKeys.history(orgId, cattleId),
    queryFn: () => listWeightHistoryAction({ cattle_id: cattleId }),
    enabled: Boolean(orgId) && Boolean(cattleId),
  });

  return { weightHistory };
};
