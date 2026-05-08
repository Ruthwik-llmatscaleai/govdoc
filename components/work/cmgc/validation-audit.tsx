import type { ValidationResult } from "@/lib/usecases/cmgc-pde/types";
import { cn } from "@/lib/utils";

export function ValidationAudit({
  validation,
  overrideReasons,
}: {
  validation: ValidationResult | null;
  /** Map of question_id → user-supplied reason (from override store). Optional;
   *  if a mismatch's question_id has no entry, the card shows "(no reason provided)". */
  overrideReasons?: Record<string, string>;
}): React.JSX.Element | null {
  if (!validation) return null;

  const { summary, deviation_impact, mismatches } = validation;

  return (
    <div className="rounded-md border border-border bg-background p-4 space-y-4">
      {/* A. Metrics row */}
      <div className="grid grid-cols-4 gap-3">
        <div>
          <div className="text-xs text-muted-foreground">Agreement</div>
          <div className="text-2xl font-semibold">{Math.round(summary.agreement_rate)}%</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Matches</div>
          <div className="text-2xl font-semibold">{summary.matches}/{summary.total_compared}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Minor differences</div>
          <div className="text-2xl font-semibold">{summary.minor_mismatches}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Major differences</div>
          <div className="text-2xl font-semibold">{summary.major_mismatches}</div>
        </div>
      </div>

      {/* B. Recommendation-change banner — only when changed */}
      {deviation_impact.recommendation_changed && (
        <div
          role="alert"
          className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900"
        >
          ⚠ Your overrides shifted the recommendation:{" "}
          <strong>{deviation_impact.ai_method}</strong> → <strong>{deviation_impact.user_method}</strong>
        </div>
      )}

      {/* C. Severity cards per mismatch */}
      {mismatches.length === 0 ? (
        <div className="rounded border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          No differences — all overrides match the AI ratings.
        </div>
      ) : (
        <div className="space-y-3">
          {mismatches.map((m) => {
            const isHighConfidence = m.ai_confidence >= 0.8 && m.severity === "major_mismatch";
            const reason = overrideReasons?.[m.question_id] ?? "(no reason provided)";
            const evidence = m.ai_evidence.trim() || "(no source)";

            return (
              <div
                key={m.question_id}
                className={cn(
                  "rounded border px-3 py-2 text-sm space-y-1",
                  isHighConfidence
                    ? "bg-rose-50 border-rose-300 text-rose-900"
                    : "bg-sky-50 border-sky-300 text-sky-900"
                )}
              >
                <div className="font-medium">
                  {isHighConfidence
                    ? `🔴 High-Confidence Override — ${m.question_id}`
                    : `🟠 Minor Difference — ${m.question_id}`}
                </div>
                <div>
                  AI: {m.ai_rating} ({Math.round(m.ai_confidence * 100)}%) → You: {m.user_rating}
                </div>
                <div>AI evidence: &ldquo;{evidence}&rdquo;</div>
                <div>Your reason: {reason}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
