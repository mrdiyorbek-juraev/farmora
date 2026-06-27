"use client";

import { useOrganization } from "@repo/auth/client";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { getDashboardMetricsAction } from "@/app/_actions/dashboard";
import {
  type DashboardRangePreset,
  resolveDateRange,
} from "@/models/dashboard";

import { dashboardKeys } from "./keys";

export const useDashboardMetrics = (preset: DashboardRangePreset) => {
  const { organization } = useOrganization();
  const orgId = organization?.id ?? "";

  // Resolve {from, to} from the preset. Memoised so the query key only
  // changes when the preset itself changes — not on every re-render.
  const dateRange = useMemo(() => resolveDateRange(preset), [preset]);

  const metrics = useQuery({
    queryKey: dashboardKeys.metrics(orgId, preset),
    queryFn: () => getDashboardMetricsAction(dateRange),
    enabled: Boolean(orgId),
    staleTime: 60_000,
  });

  return { metrics };
};
