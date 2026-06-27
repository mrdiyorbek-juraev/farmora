import type { DashboardMetricsRange } from "@/models/dashboard";

export const dashboardKeys = {
  all: (orgId: string) => [`${orgId}/DASHBOARD`] as const,
  metrics: (orgId: string, range?: DashboardMetricsRange) =>
    [
      `${orgId}/DASHBOARD`,
      "METRICS",
      range?.from ?? null,
      range?.to ?? null,
    ] as const,
} as const;