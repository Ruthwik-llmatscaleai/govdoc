export type RowStatus = "Pass" | "Warning" | "Fail" | "N/A" | "Error";

type ToneClasses = {
  cell: string;
  rowBorder: string;
};

// Soft theme-toned palette — Pass/Warning/Fail/N/A read clearly against the
// cream background without the saturated caltrans red/green. Original caltrans
// hexes were #d4edda/#fff3cd/#f8d7da/#e2e3e5 — kept here as a paper trail.
export const STATUS_TONE: Record<RowStatus, ToneClasses> = {
  Pass:    { cell: "bg-emerald-50 text-emerald-700",          rowBorder: "border-l-4 border-l-emerald-300" },
  Warning: { cell: "bg-amber-50 text-amber-800",              rowBorder: "border-l-4 border-l-amber-300" },
  Fail:    { cell: "bg-rose-50 text-rose-700",                rowBorder: "border-l-4 border-l-rose-300" },
  "N/A":   { cell: "bg-muted text-muted-foreground",          rowBorder: "border-l-4 border-l-border" },
  Error:   { cell: "bg-rose-50 text-rose-700",                rowBorder: "border-l-4 border-l-rose-300" },
};

export function statusFromScore(score: number): RowStatus {
  if (score === -1) return "N/A";
  if (score === 0) return "Error";
  if (score >= 4) return "Pass";
  if (score === 3) return "Warning";
  return "Fail";
}
