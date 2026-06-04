"use client";
import type { MatrixResult } from "@/features/usecases/cmgc-pde/scoring/point-matrix";
import { ALL_METHODS, type DeliveryMethod } from "@/features/usecases/cmgc-pde/scoring/point-matrix";

type Props = { matrix: MatrixResult };

const SECTION_LABELS: Record<string, string> = {
  A: "Project Scope & Characteristics",
  B: "Schedule Issues",
  C: "Opportunity for Innovation",
  D: "Quality Enhancement",
  E: "Cost Issues",
  F: "Staffing Issues",
};

const SHORT_LABELS: Record<DeliveryMethod, string> = {
  DBB: "DBB",
  DS: "D-Seq",
  DB_LB: "DB/LB",
  DB_BV: "DB/BV",
  CMGC: "CM/GC",
  PDB: "PDB",
};

export function MatrixScoring({ matrix }: Props) {
  const questions = Object.keys(matrix.per_question).sort((a, b) => {
    const sa = a[0]!, sb = b[0]!;
    if (sa !== sb) return sa.localeCompare(sb);
    const na = parseInt(a.slice(1)), nb = parseInt(b.slice(1));
    return na - nb;
  });

  let lastSection = "";

  return (
    <div className="space-y-4 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-5">
      <h3 className="text-[18px] font-medium tracking-[-0.01em] text-[var(--color-ink)]" style={{ fontFamily: "var(--font-display)" }}>
        Selection Matrix <span className="text-[13px] font-normal text-[var(--color-ink-mute)]">(Caltrans format)</span>
      </h3>

      {/* Summary */}
      <div className="overflow-x-auto rounded-md border border-[var(--color-line)]">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--color-cream-soft)] text-[10px] uppercase tracking-wider text-[var(--color-ink-faint)]">
            <tr>
              <th className="text-left p-2">Method</th>
              <th className="text-right p-2">WS 1</th>
              <th className="text-right p-2">WS 2</th>
              <th className="text-right p-2 font-bold">Total</th>
              <th className="text-left p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {matrix.method_scores.map((m) => (
              <tr
                key={m.method}
                className={`border-t border-[var(--color-line)] ${m.method === matrix.recommended ? "bg-[var(--color-govdoc-primary)]/5" : ""} ${m.noGo ? "opacity-50" : ""}`}
              >
                <td className="p-2 font-medium text-[var(--color-ink)]">
                  {m.label}
                  {m.method === matrix.recommended && (
                    <span className="ml-2 rounded bg-[var(--color-govdoc-primary)] px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                      Recommended
                    </span>
                  )}
                </td>
                <td className="p-2 text-right font-mono">{m.worksheet1}</td>
                <td className="p-2 text-right font-mono">{m.worksheet2}</td>
                <td className="p-2 text-right font-mono font-bold">{m.total}</td>
                <td className="p-2">
                  {m.noGo ? (
                    <span className="rounded border border-destructive/30 bg-destructive/5 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                      No-Go ({m.noGoQuestions.join(", ")})
                    </span>
                  ) : (
                    <span className="text-[11px] text-[var(--color-ink-mute)]">Eligible</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Per-question detail */}
      <details className="mt-2">
        <summary className="cursor-pointer text-xs font-medium text-[var(--color-ink-mute)] hover:text-[var(--color-ink)]">
          Per-question point breakdown
        </summary>
        <div className="mt-3 overflow-x-auto rounded-md border border-[var(--color-line)]">
          <table className="min-w-full text-xs">
            <thead className="bg-[var(--color-cream-soft)] text-[9px] uppercase tracking-wider text-[var(--color-ink-faint)]">
              <tr>
                <th className="text-left p-1.5 w-14">Q</th>
                {ALL_METHODS.map((m) => (
                  <th key={m} className="text-right p-1.5 w-14">{SHORT_LABELS[m]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {questions.map((qid) => {
                const sec = qid[0]!;
                const showHeader = sec !== lastSection;
                lastSection = sec;
                const pts = matrix.per_question[qid]!;
                return (
                  <>
                    {showHeader && (
                      <tr key={`hdr-${sec}`} className="bg-muted/30">
                        <td colSpan={7} className="p-1.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--color-ink-faint)]">
                          {sec}: {SECTION_LABELS[sec]}
                        </td>
                      </tr>
                    )}
                    <tr key={qid} className="border-t border-[var(--color-line-soft)]">
                      <td className="p-1.5 font-mono font-medium text-[var(--color-ink)]">{qid}</td>
                      {ALL_METHODS.map((m) => {
                        const v = pts[m];
                        return (
                          <td
                            key={m}
                            className={`p-1.5 text-right font-mono ${v === -1 ? "font-bold text-destructive" : v === 0 ? "text-[var(--color-ink-faint)]" : "text-[var(--color-ink)]"}`}
                          >
                            {v === -1 ? "N/G" : v}
                          </td>
                        );
                      })}
                    </tr>
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
