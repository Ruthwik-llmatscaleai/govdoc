// Value formatting for finance viz cards/charts.

function isCurrency(unit?: string): boolean {
  return unit === "$" || unit?.toUpperCase() === "USD";
}

/** Full, exact value with thousands separators — used for stat cards and tooltips. */
export function formatValue(value: number, unit?: string): string {
  if (isCurrency(unit)) {
    return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  }
  if (unit === "%") return `${value.toLocaleString("en-US")}%`;
  const n = value.toLocaleString("en-US");
  return unit ? `${n} ${unit}` : n;
}

/** Compact value ($392.6M, 1.2K) — used for chart axis ticks. */
export function formatCompact(value: number, unit?: string): string {
  const abs = Math.abs(value);
  let s: string;
  if (abs >= 1_000_000_000) s = `${(value / 1_000_000_000).toFixed(1)}B`;
  else if (abs >= 1_000_000) s = `${(value / 1_000_000).toFixed(1)}M`;
  else if (abs >= 1_000) s = `${(value / 1_000).toFixed(1)}K`;
  else s = `${value}`;
  if (isCurrency(unit)) return `$${s}`;
  if (unit === "%") return `${s}%`;
  return unit ? `${s} ${unit}` : s;
}

// GovDoc-leaning palette for multi-series charts (forest greens + earth tones).
export const VIZ_COLORS = ["#3D5740", "#6E8B5B", "#A9694B", "#B7975A", "#557157", "#8B877D", "#C2502F"];
