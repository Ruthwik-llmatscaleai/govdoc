"use client";
import type { MatrixResult } from "@/features/usecases/cmgc-pde/scoring/point-matrix";
import { ALL_METHODS, type DeliveryMethod } from "@/features/usecases/cmgc-pde/scoring/point-matrix";

type Props = { matrix: MatrixResult };

const SHORT_LABELS: Record<DeliveryMethod, string> = {
  DBB: "Design-Bid-Build",
  DS: "Design-Sequencing",
  DB_LB: "Design-Build/Low Bid",
  DB_BV: "Design-Build/Best-Value",
  CMGC: "CM/GC",
  PDB: "Progressive Design-Build",
};

export function MatrixScoring({ matrix }: Props) {
  const ordered = ALL_METHODS.map((m) => matrix.method_scores.find((ms) => ms.method === m)!).filter(Boolean);

  return (
    <div className="space-y-4 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-5">
      <h3 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
        Scoring Summary
      </h3>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-line)]">
              <th className="text-left py-2 pr-4"></th>
              {ordered.map((m) => (
                <th key={m.method} className="px-3 py-2 text-center font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-ink-faint)]">
                  {SHORT_LABELS[m.method]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[var(--color-line-soft)]">
              <td className="py-3 pr-4 text-[13px] text-[var(--color-ink-soft)]">
                Project Scope &<br />Characteristic Score<br />
                <span className="text-[11px] text-[var(--color-ink-faint)]">(Worksheet 1)</span>
              </td>
              {ordered.map((m) => (
                <td key={m.method} className="px-3 py-3 text-center font-mono text-[14px] font-medium text-[var(--color-ink)]">
                  {m.worksheet1}
                </td>
              ))}
            </tr>
            <tr className="border-b border-[var(--color-line-soft)]">
              <td className="py-3 pr-4 text-[13px] text-[var(--color-ink-soft)]">
                Success Criteria<br />Score
                <span className="text-[11px] text-[var(--color-ink-faint)]"> (Worksheet 2)</span>
              </td>
              {ordered.map((m) => (
                <td key={m.method} className="px-3 py-3 text-center font-mono text-[14px] font-medium text-[var(--color-ink)]">
                  {m.worksheet2}
                </td>
              ))}
            </tr>
            <tr className="border-t-2 border-[var(--color-line)]">
              <td className="py-3 pr-4 text-[13px] font-semibold text-[var(--color-ink)]">
                Total Score
              </td>
              {ordered.map((m) => {
                const isWinner = m.method === matrix.recommended;
                return (
                  <td key={m.method} className={`px-3 py-3 text-center font-mono text-[16px] font-bold ${isWinner ? "text-[var(--color-govdoc-primary)]" : "text-[var(--color-ink)]"} ${m.noGo ? "opacity-40 line-through" : ""}`}>
                    {m.total}
                    {m.noGo && <div className="mt-1 text-[9px] font-medium uppercase text-destructive no-underline">No-Go</div>}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
