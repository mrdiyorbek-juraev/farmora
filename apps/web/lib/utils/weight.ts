// Weight is stored in kilograms (matching cattle.weight_kg) but the herd
// detail UI presents pounds, so all kg→lb conversion lives here.

const KG_TO_LB = 2.204_622_62;

/** Convert kilograms to pounds. */
export function kgToLb(kg: number): number {
  return kg * KG_TO_LB;
}

/**
 * Format a kg value as pounds with up to 3 decimals, matching the
 * weight-history table/chart (e.g. "881.848"). Returns "—" for nullish.
 */
export function formatLb(kg: number | null | undefined): string {
  if (kg == null) {
    return "—";
  }
  return kgToLb(kg).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
}
