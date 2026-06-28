// Weight is stored and displayed in kilograms (matching cattle.weight_kg
// and the weight_measurements table). Formatting lives here so every
// weight surface renders consistently.

/**
 * Format a kg value with up to 2 decimals (e.g. "620", "430.5").
 * Returns "—" for nullish input.
 */
export function formatKg(kg: number | null | undefined): string {
  if (kg == null) {
    return "—";
  }
  return kg.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}
