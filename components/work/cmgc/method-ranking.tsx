import type { MultiMethodResult } from "@/lib/usecases/cmgc-pde/types";

type Props = { multiMethod: MultiMethodResult };

export function MethodRanking({ multiMethod }: Props) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Method Ranking</h3>
      {multiMethod.method_scores.map((m) => (
        <div key={m.method} className={`border rounded p-3 ${m.blocked ? "opacity-60" : ""}`} data-testid={`method-row-${m.method}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-bold text-lg">#{m.rank}</span>
              <span className="font-medium">{m.method}</span>
              <span className="text-sm text-muted-foreground">score {m.score.toFixed(4)}</span>
            </div>
            {m.blocked && (
              <span className="px-2 py-0.5 bg-red-100 text-red-900 rounded text-xs" data-testid={`blocked-${m.method}`}>
                Blocked
              </span>
            )}
          </div>
          {m.key_factors_reasoning && (
            <p className="text-sm mt-2">{m.key_factors_reasoning}</p>
          )}
          {m.key_factors.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {m.key_factors.map((kf, i) => (
                <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-xs">{kf}</span>
              ))}
            </div>
          )}
          <details className="mt-2 text-sm">
            <summary className="cursor-pointer">Pros / Cons</summary>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div>
                <h4 className="font-medium text-xs uppercase text-muted-foreground">Pros</h4>
                <ul className="list-disc pl-5">{m.pros.map((p, i) => <li key={i}>{p}</li>)}</ul>
              </div>
              <div>
                <h4 className="font-medium text-xs uppercase text-muted-foreground">Cons</h4>
                <ul className="list-disc pl-5">{m.cons.map((c, i) => <li key={i}>{c}</li>)}</ul>
              </div>
            </div>
          </details>
          {m.block_reasons.length > 0 && (
            <div className="text-xs text-red-700 mt-1">
              {m.block_reasons.map((br, i) => <div key={i}>• {br}</div>)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
