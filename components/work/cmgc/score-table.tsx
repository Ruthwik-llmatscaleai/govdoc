"use client";
import { useOverridesStore } from "@/store/use-overrides";
import type { CmgcRating } from "@/lib/usecases/cmgc-pde/types";
import type { Rating } from "@/lib/usecases/cmgc-pde/rubric";

type Props = {
  ratings: CmgcRating[];
};

export function ScoreTable({ ratings }: Props) {
  const history = useOverridesStore((s) => s.history);

  // Latest override per question_id wins. Overrides are written by HiflWizard's
  // OverrideCard; this table is read-only and reflects the effective rating.
  const overrideMap: Record<string, Rating | undefined> = {};
  for (const entry of history) {
    overrideMap[entry.category] = entry.newValue as Rating;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="text-left p-2">ID</th>
            <th className="text-left p-2">Question</th>
            <th className="text-left p-2">AI Rating</th>
            <th className="text-left p-2">Effective</th>
            <th className="text-left p-2">Confidence</th>
            <th className="text-left p-2">Source</th>
          </tr>
        </thead>
        <tbody>
          {ratings.map((r) => {
            // Use `||` rather than `??` so that empty-string ratings (legitimate
            // when narrative info is missing) collapse to "—" alongside null/undefined.
            const override = overrideMap[r.question_id];
            const effectiveDisplay = override || r.selected_rating || "—";
            return (
              <tr key={r.question_id} className="border-t align-top">
                <td className="p-2 font-mono">{r.question_id ?? "—"}</td>
                <td className="p-2">{r.question_text ?? "—"}</td>
                <td className="p-2">{r.selected_rating || "—"}</td>
                <td className="p-2">
                  <span className="font-medium">{effectiveDisplay}</span>
                </td>
                <td className="p-2">
                  {r.confidence != null ? r.confidence.toFixed(2) : "—"}
                </td>
                <td className="p-2 text-xs">
                  {(r.source_reasoning ?? "—").slice(0, 200)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
