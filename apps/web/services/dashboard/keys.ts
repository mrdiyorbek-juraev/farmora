export const dashboardKeys = {
  all: (orgId: string) => [`${orgId}/DASHBOARD`] as const,
  metrics: (orgId: string) => [`${orgId}/DASHBOARD`, "METRICS"] as const,
} as const;
