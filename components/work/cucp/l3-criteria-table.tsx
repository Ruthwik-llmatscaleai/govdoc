"use client";
import { cn } from "@/lib/utils";
import { STATUS_TONE, type RowStatus } from "../row/status-tone";
import type { Criterion } from "@/lib/usecases/cucp-reevals/types";

export type L3OverrideMap = Record<
  string,
  { verdict: string; request_info: "Yes" | "No"; reason: string }
>;

function verdictToStatus(verdict: string): RowStatus {
  const v = verdict.toLowerCase();
  if (v.includes("pass")) return "Pass";
  if (v.includes("fail")) return "Fail";
  if (v.includes("info") || v.includes("request")) return "Warning";
  return "N/A";
}

// Stable lowercase token for tests / styling hooks (matches verdictToStatus buckets).
function verdictTone(verdict: string): "pass" | "fail" | "warning" | "na" {
  const s = verdictToStatus(verdict);
  if (s === "Pass") return "pass";
  if (s === "Fail") return "fail";
  if (s === "Warning") return "warning";
  return "na";
}

export function L3CriteriaTable({
  criteria,
  overrideMap,
}: {
  criteria: readonly Criterion[];
  overrideMap?: L3OverrideMap;
}): React.JSX.Element {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="text-left p-2">#</th>
            <th className="text-left p-2">Criterion</th>
            <th className="text-left p-2">AI Verdict</th>
            <th className="text-left p-2">Confidence</th>
            <th className="text-left p-2">Reasoning</th>
          </tr>
        </thead>
        <tbody>
          {criteria.map((c) => {
            const ov = overrideMap?.[String(c.s_no)];
            const verdict = ov?.verdict ?? c.pass_fail ?? "—";
            const requestInfo = ov?.request_info ?? c.request_info;
            // request_info=Yes flips the final decision per caltrans cucp_reevals.py:207,
            // so the row should read as Warning even when verdict text is Pass/Fail.
            const status: RowStatus =
              requestInfo === "Yes" ? "Warning" : verdictToStatus(verdict);
            const tone = STATUS_TONE[status];
            const dataVerdict =
              requestInfo === "Yes" ? "warning" : verdictTone(verdict);
            const reasoning = ov?.reason ?? c.reasoning ?? "—";
            const category = c.category || "—";
            const qualification = c.qualification || "—";

            return (
              <tr key={c.s_no} className={cn("border-t align-top", tone.rowBorder)}>
                <td className="p-2 font-mono">{c.s_no}</td>
                <td className="p-2 max-w-md">
                  <div className="font-medium">{category}</div>
                  <div className="text-xs text-muted-foreground">{qualification}</div>
                </td>
                <td
                  className={cn(
                    "p-2 font-semibold whitespace-nowrap",
                    tone.cell,
                  )}
                  data-verdict={dataVerdict}
                >
                  {verdict}
                </td>
                <td className="p-2 font-mono">
                  {c.confidence != null ? c.confidence.toFixed(2) : "—"}
                </td>
                <td className="p-2 text-xs text-muted-foreground max-w-lg break-words">
                  {reasoning && reasoning.trim().length > 0 ? reasoning : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
