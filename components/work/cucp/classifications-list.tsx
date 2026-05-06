import type { Classification } from "@/lib/usecases/cucp-reevals/types";

type Props = { classifications: Classification[] };

export function ClassificationsList({ classifications }: Props) {
  if (classifications.length === 0) {
    return <div className="text-sm text-muted-foreground">No classifications produced.</div>;
  }
  return (
    <ul className="space-y-3">
      {classifications.map((c) => (
        <li key={c.fact_id} className="border rounded p-3 space-y-1">
          <div className="flex justify-between items-center">
            <span className="font-mono text-sm">{c.fact_id}</span>
            <span className="text-xs px-2 py-1 rounded bg-muted">{c.classification}</span>
          </div>
          <div className="text-sm">{c.summary}</div>
          <div className="text-xs text-muted-foreground">{c.reasoning}</div>
        </li>
      ))}
    </ul>
  );
}
