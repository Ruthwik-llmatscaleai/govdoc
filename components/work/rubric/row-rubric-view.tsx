import rubricSchema from "@/lib/usecases/row-appraisal/assets/rubric_schema.json";
import { STATUS_TONE, statusFromScore } from "@/components/work/row/status-tone";

type RowRubricSchema = Record<string, Record<"1" | "2" | "3" | "4" | "5", string>>;

const TIERS: ("1" | "2" | "3" | "4" | "5")[] = ["1", "2", "3", "4", "5"];

export function RowRubricView() {
  const schema = rubricSchema as RowRubricSchema;
  const categories = Object.entries(schema);

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {categories.length} categories. Each is rated on a 1–5 scale; cells
        without text indicate the tier is not used for that category.
      </p>
      {categories.map(([category, tiers]) => (
        <details
          key={category}
          className="rounded-2xl border border-border bg-card"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-semibold text-foreground">
            <span className="break-words">{category}</span>
            <span className="text-xs font-normal text-muted-foreground">
              ▾
            </span>
          </summary>
          <div className="border-t border-border p-4">
            <table className="w-full text-sm">
              <thead className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="w-16 py-2">Score</th>
                  <th className="py-2">Description</th>
                </tr>
              </thead>
              <tbody>
                {TIERS.map((tier) => {
                  const tone = STATUS_TONE[statusFromScore(Number(tier))];
                  const text = tiers[tier];
                  return (
                    <tr key={tier} className="border-t border-border">
                      <td className={`px-2 py-3 align-top font-semibold ${tone.cell}`}>
                        {tier}
                      </td>
                      <td className="break-words px-3 py-3 align-top text-foreground/85">
                        {text || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </details>
      ))}
    </div>
  );
}
