"use client";
import { Undo2, Trash2 } from "lucide-react";
import { SecondaryButton } from "@/components/work/form-fields";
import { useOverridesStore } from "@/store/use-overrides";
import type { CmgcRating } from "@/lib/usecases/cmgc-pde/types";
import type { Rating } from "@/lib/usecases/cmgc-pde/rubric";

type Props = {
  ratings: CmgcRating[];
  viewMode?: "district" | "hifl"; // default "hifl" for backwards compat
};

const SELECT_CLASS =
  "h-9 rounded-lg border border-input bg-muted/30 px-2 text-sm transition-colors focus:border-primary/40 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/15";

export function ScoreTable({ ratings, viewMode = "hifl" }: Props) {
  const history = useOverridesStore((s) => s.history);
  const push = useOverridesStore((s) => s.push);
  const undo = useOverridesStore((s) => s.undo);
  const clear = useOverridesStore((s) => s.clear);

  const isDistrict = viewMode === "district";

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
      {!isDistrict && (
        <div className="flex flex-wrap items-center gap-2">
          <SecondaryButton type="button" disabled={history.length === 0} onClick={undo}>
            <Undo2 className="size-4" /> Undo
          </SecondaryButton>
          <SecondaryButton type="button" disabled={history.length === 0} onClick={clear}>
            <Trash2 className="size-4" /> Clear all overrides
          </SecondaryButton>
          <span className="text-sm text-muted-foreground">{history.length} override(s)</span>
        </div>
      )}
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
              const effective = overrideMap[r.question_id] ?? r.selected_rating;
              return (
                <tr key={r.question_id} className="border-t align-top">
                  <td className="p-2 font-mono">{r.question_id}</td>
                  <td className="p-2">{r.question_text}</td>
                  <td className="p-2">{r.selected_rating}</td>
                  <td className="p-2">
                    {isDistrict ? (
                      <span className="font-medium">{effective}</span>
                    ) : (
                      <select
                        className={SELECT_CLASS}
                        aria-label={`Override rating for ${r.question_id}`}
                        value={effective}
                        onChange={(e) => onChange(r.question_id, effective, e.target.value as Rating)}
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                      </select>
                    )}
                  </td>
                  <td className="p-2">{r.confidence.toFixed(2)}</td>
                  <td className="p-2 text-xs">{r.source_reasoning.slice(0, 200)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
