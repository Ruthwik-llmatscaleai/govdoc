import type { RecommendationResult } from "@/lib/usecases/cmgc-pde/types";

type Props = { recommendation: RecommendationResult };

export function RecommendationCard({ recommendation }: Props) {
  return (
    <div className="border rounded p-4 space-y-3">
      <h2 className="text-2xl font-bold">{recommendation.recommended_method || "—"}</h2>
      <div className="flex gap-3 items-center">
        <span className="px-2 py-1 bg-blue-100 text-blue-900 rounded text-sm">
          Composite {recommendation.composite_score.toFixed(3)} / 3.000
        </span>
        {recommendation.is_borderline && (
          <span className="px-2 py-1 bg-amber-100 text-amber-900 rounded text-sm" data-testid="borderline-chip">
            Borderline
          </span>
        )}
      </div>
      {recommendation.runner_up_method && (
        <p className="text-sm">
          Runner-up: <span className="font-medium">{recommendation.runner_up_method}</span>
          {recommendation.runner_up_score != null && (
            <> (suitability {recommendation.runner_up_score.toFixed(4)})</>
          )}
        </p>
      )}
      {recommendation.override_reasons.length > 0 && (
        <div>
          <h3 className="text-sm font-medium">Override Reasons</h3>
          <ul className="list-disc pl-5 text-sm">
            {recommendation.override_reasons.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      )}
      {recommendation.comparison_text && (
        <div className="text-sm space-y-1">
          {recommendation.comparison_text.split("\n").map((line, i) => (
            <div key={i} dangerouslySetInnerHTML={{
              __html: line.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>"),
            }} />
          ))}
        </div>
      )}
    </div>
  );
}
