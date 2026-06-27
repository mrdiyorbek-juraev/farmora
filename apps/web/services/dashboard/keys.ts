import type { DashboardRangePreset } from "@/models/dashboard";

export const dashboardKeys = {
  all: (orgId: string) => [`${orgId}/DASHBOARD`] as const,
  metrics: (orgId: string, preset: DashboardRangePreset) =>
    [`${orgId}/DASHBOARD`, "METRICS", preset] as const,
} as const;
