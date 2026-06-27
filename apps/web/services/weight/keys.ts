export const weightKeys = {
  all: (orgId: string) => [`${orgId}/WEIGHT`] as const,
  history: (orgId: string, cattleId: string) =>
    [`${orgId}/WEIGHT`, "HISTORY", cattleId] as const,
} as const;
