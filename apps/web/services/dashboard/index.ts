"use client";

import { useOrganization } from "@repo/auth/client";
import { useQuery } from "@tanstack/react-query";

import { getDashboardMetricsAction } from "@/app/_actions/dashboard";
import type { DashboardMetricsRange } from "@/models/dashboard";

import { dashboardKeys } from "./keys";

export const useDashboardMetrics = (range?: DashboardMetricsRange) => {
  const { organization } = useOrganization();
  const orgId = organization?.id ?? "";

  const metrics = useQuery({
    queryKey: dashboardKeys.metrics(orgId, range),
    queryFn: () => getDashboardMetricsAction(range),
    enabled: Boolean(orgId),
    staleTime: 60_000,
  });

  return { metrics };
};
