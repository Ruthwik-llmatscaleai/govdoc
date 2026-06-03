// Client-safe rubric type and defaults for ROW. Server-side loader is in
// rubric-merged.ts.
import rubricSchema from "./assets/rubric_schema.json";

export type RowRubricData = Record<
  string,
  Record<"1" | "2" | "3" | "4" | "5", string>
>;

export function defaultRowRubric(): RowRubricData {
  const raw = rubricSchema as Record<string, Record<string, string>>;
  const out: RowRubricData = {};
  for (const [cat, val] of Object.entries(raw)) {
    out[cat] = {
      "1": val["1"] ?? "",
      "2": val["2"] ?? "",
      "3": val["3"] ?? "",
      "4": val["4"] ?? "",
      "5": val["5"] ?? "",
    };
  }
  return out;
}
