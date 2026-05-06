import type { ExtractedFact } from "@/lib/usecases/cucp-reevals/types";

type Props = { facts: ExtractedFact[] };

export function FactsList({ facts }: Props) {
  if (facts.length === 0) {
    return <div className="text-sm text-muted-foreground">No facts extracted.</div>;
  }
  return (
    <ol className="space-y-3 list-decimal list-inside">
      {facts.map((f) => (
        <li key={f.id} className="border rounded p-3 space-y-1">
          <div className="font-medium">{f.what}</div>
          <div className="text-sm text-muted-foreground">
            {f.when} • {f.where} • {f.who}
          </div>
          <div className="text-sm">Why: {f.why}</div>
          <div className="text-sm">Magnitude: {f.magnitude}</div>
          <div className="text-xs italic">Demographic flag: {f.demographic_flag ? "Yes" : "No"}</div>
          <blockquote className="text-xs border-l-2 pl-2 mt-1">{f.source_quote}</blockquote>
        </li>
      ))}
    </ol>
  );
}
