import type { RecommendationResult } from "@/features/usecases/cmgc-pde/types";
import type { MatrixResult } from "@/features/usecases/cmgc-pde/scoring/point-matrix";

type Props = {
  recommendation: RecommendationResult;
  matrix?: MatrixResult | null;
  showScores?: boolean;
};

export function RecommendationCard({ recommendation, matrix, showScores = false }: Props) {
  const primaryMethod = matrix?.recommended_label ?? recommendation.recommended_method ?? "—";
  const primaryTotal = matrix?.recommended_total ?? null;
  const runnerUp = matrix?.runner_up_label ?? recommendation.runner_up_method;
  const runnerUpTotal = matrix?.runner_up_total ?? null;
  const noGoMethods = matrix?.no_go_methods ?? [];

  return (
    <div className="space-y-4 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-5">
      <div className="space-y-1">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
          Recommended delivery method
        </p>
        <h2 className="text-2xl font-medium tracking-[-0.01em] text-[var(--color-ink)]" style={{ fontFamily: "var(--font-display)" }}>
          {primaryMethod}
          {showScores && primaryTotal != null && (
            <span className="ml-3 text-[16px] font-mono font-bold text-[var(--color-govdoc-primary)]">
              {primaryTotal} pts
            </span>
          )}
        </h2>
      </div>

      {runnerUp && (
        <p className="text-sm text-[var(--color-ink-mute)]">
          Runner-up:{" "}
          <span className="font-medium text-[var(--color-ink)]">{runnerUp}</span>
          {showScores && runnerUpTotal != null && (
            <span className="ml-1 font-mono text-[var(--color-ink-mute)]">({runnerUpTotal} pts)</span>
          )}
        </p>
      )}

      {noGoMethods.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {noGoMethods.map((m) => (
            <span key={m} className="rounded border border-destructive/30 bg-destructive/5 px-2 py-0.5 text-[10px] font-medium text-destructive">
              {m} — No-Go
            </span>
          ))}
        </div>
      )}

      {recommendation.override_reasons.length > 0 && (
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-faint)]">
            Override reasons
          </h3>
          <ul className="list-disc pl-5 text-sm text-[var(--color-ink-soft)]">
            {recommendation.override_reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
