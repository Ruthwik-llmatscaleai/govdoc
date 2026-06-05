"use client";

import { formatValue } from "./format";
import type { VizItem } from "./viz-block";

export function VizStatCards({ data, unit }: { data: VizItem[]; unit?: string }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((item, i) => (
        <div key={i} className="rounded-xl border border-[#d6cfba] bg-[#FCFAF3] px-4 py-3">
          <div
            className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8B877D]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {item.label}
          </div>
          <div
            className="mt-1 text-[22px] font-semibold tracking-[-0.012em] text-[#0E1410]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {formatValue(item.value, unit)}
          </div>
        </div>
      ))}
    </div>
  );
}
