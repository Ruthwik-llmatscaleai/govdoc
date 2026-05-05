import type { ValidationResult } from "@/lib/usecases/cmgc-pde/types";

type Props = { validation: ValidationResult | null };

export function ValidationCard({ validation }: Props) {
  if (!validation) return null;

  const { summary, deviation_impact, mismatches } = validation;
  return (
    <div className="border rounded p-4 space-y-3">
      <h3 className="text-lg font-semibold">Validation vs District Ratings</h3>
      <div className="flex gap-4 text-sm">
        <div>
          <div className="text-muted-foreground">Agreement</div>
          <div className="text-xl font-medium">{summary.agreement_rate}%</div>
        </div>
        <div>
          <div className="text-muted-foreground">Matches</div>
          <div className="text-xl">{summary.matches}/{summary.total_compared}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Major</div>
          <div className="text-xl">{summary.major_mismatches}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Minor</div>
          <div className="text-xl">{summary.minor_mismatches}</div>
        </div>
      </div>

      <div
        className={`p-3 rounded text-sm ${deviation_impact.recommendation_changed ? "bg-amber-50 border border-amber-300" : "bg-gray-50"}`}
        data-testid="deviation-callout"
      >
        AI recommended <strong>{deviation_impact.ai_method}</strong>; with district ratings applied,
        recommendation becomes <strong>{deviation_impact.user_method}</strong>.
        {deviation_impact.recommendation_changed
          ? " Recommendation changed."
          : " Recommendation unchanged."}
      </div>

      {mismatches.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm">
            View {mismatches.length} mismatch{mismatches.length === 1 ? "" : "es"}
          </summary>
          <table className="min-w-full border mt-2 text-sm">
            <thead>
              <tr>
                <th className="text-left p-2 border">ID</th>
                <th className="text-left p-2 border">AI</th>
                <th className="text-left p-2 border">District</th>
                <th className="text-left p-2 border">Severity</th>
                <th className="text-left p-2 border">AI Confidence</th>
              </tr>
            </thead>
            <tbody>
              {mismatches.map((m) => (
                <tr key={m.question_id}>
                  <td className="p-2 border font-mono">{m.question_id}</td>
                  <td className="p-2 border">{m.ai_rating}</td>
                  <td className="p-2 border">{m.user_rating}</td>
                  <td className="p-2 border">{m.severity}</td>
                  <td className="p-2 border">{m.ai_confidence.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </div>
  );
}
