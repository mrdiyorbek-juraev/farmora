export const activityKeys = {
  all: (orgId: string) => [`${orgId}/ACTIVITY`] as const,
  byCattle: (orgId: string, cattleId: string) =>
    [`${orgId}/ACTIVITY`, "BY_CATTLE", cattleId] as const,
} as const;
