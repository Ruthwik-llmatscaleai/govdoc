export type RowStatus = "Pass" | "Warning" | "Fail" | "N/A" | "Error";

type ToneClasses = {
  cell: string;
  rowBorder: string;
};

// Palette mirrors caltrans landing_ai_ui.py (Pass/Warning/Fail/N/A bg+fg).
export const STATUS_TONE: Record<RowStatus, ToneClasses> = {
  Pass:    { cell: "bg-[#d4edda] text-[#155724]", rowBorder: "border-l-4 border-l-[#28a745]" },
  Warning: { cell: "bg-[#fff3cd] text-[#856404]", rowBorder: "border-l-4 border-l-[#ffc107]" },
  Fail:    { cell: "bg-[#f8d7da] text-[#721c24]", rowBorder: "border-l-4 border-l-[#dc3545]" },
  "N/A":   { cell: "bg-[#e2e3e5] text-[#383d41]", rowBorder: "border-l-4 border-l-[#808080]" },
  Error:   { cell: "bg-[#f8d7da] text-[#721c24]", rowBorder: "border-l-4 border-l-[#dc3545]" },
};

export function statusFromScore(score: number): RowStatus {
  if (score === -1) return "N/A";
  if (score === 0) return "Error";
  if (score >= 4) return "Pass";
  if (score === 3) return "Warning";
  return "Fail";
}
