"use client";
import { useOverridesStore } from "@/store/use-overrides";
import type { CmgcRating } from "@/lib/usecases/cmgc-pde/types";
import type { Rating } from "@/lib/usecases/cmgc-pde/rubric";

type Props = { ratings: CmgcRating[] };

export function ScoreTable({ ratings }: Props) {
  const history = useOverridesStore((s) => s.history);
  const push = useOverridesStore((s) => s.push);
  const undo = useOverridesStore((s) => s.undo);
  const clear = useOverridesStore((s) => s.clear);

  // Latest override per question_id wins
  const overrideMap: Record<string, Rating> = {};
  for (const entry of history) {
    overrideMap[entry.category] = entry.newValue as Rating;
  }

  function onChange(qid: string, oldValue: Rating, newValue: Rating) {
    if (newValue === oldValue) return;
    push({ category: qid, oldValue, newValue });
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button type="button" onClick={undo} disabled={history.length === 0}>Undo</button>
        <button type="button" onClick={clear} disabled={history.length === 0}>Clear all overrides</button>
        <span className="text-sm text-muted-foreground">{history.length} override(s)</span>
      </div>
      <table className="min-w-full border">
        <thead>
          <tr>
            <th className="text-left p-2 border">ID</th>
            <th className="text-left p-2 border">Question</th>
            <th className="text-left p-2 border">AI Rating</th>
            <th className="text-left p-2 border">Effective</th>
            <th className="text-left p-2 border">Confidence</th>
            <th className="text-left p-2 border">Source</th>
          </tr>
        </thead>
        <tbody>
          {ratings.map((r) => {
            const effective = overrideMap[r.question_id] ?? r.selected_rating;
            return (
              <tr key={r.question_id}>
                <td className="p-2 border font-mono">{r.question_id}</td>
                <td className="p-2 border">{r.question_text}</td>
                <td className="p-2 border">{r.selected_rating}</td>
                <td className="p-2 border">
                  <select
                    aria-label={`Override rating for ${r.question_id}`}
                    value={effective}
                    onChange={(e) => onChange(r.question_id, effective, e.target.value as Rating)}
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </td>
                <td className="p-2 border">{r.confidence.toFixed(2)}</td>
                <td className="p-2 border text-xs">{r.source_reasoning.slice(0, 200)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
