"use client";

import { useOrganization } from "@repo/auth/client";
import { useQuery } from "@tanstack/react-query";

import { getDashboardMetricsAction } from "@/app/_actions/dashboard";

import { dashboardKeys } from "./keys";

export const useDashboardMetrics = () => {
  const { organization } = useOrganization();
  const orgId = organization?.id ?? "";

  const metrics = useQuery({
    queryKey: dashboardKeys.metrics(orgId),
    queryFn: () => getDashboardMetricsAction(),
    enabled: Boolean(orgId),
    staleTime: 60_000,
  });

  return { metrics };
};
