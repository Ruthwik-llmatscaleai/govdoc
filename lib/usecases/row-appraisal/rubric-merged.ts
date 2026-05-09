import rubricSchema from "./assets/rubric_schema.json";
import { loadSavedRubric } from "../rubric-store";

export type RowRubricData = Record<
  string,
  Record<"1" | "2" | "3" | "4" | "5", string>
>;

export function defaultRowRubric(): RowRubricData {
  return rubricSchema as RowRubricData;
}

function isValidTiers(x: unknown): x is RowRubricData[string] {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (["1", "2", "3", "4", "5"] as const).every((k) => typeof o[k] === "string");
}

export async function loadRowRubric(): Promise<RowRubricData> {
  const saved = await loadSavedRubric("row-appraisal");
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return defaultRowRubric();
  const obj = saved as Record<string, unknown>;
  for (const v of Object.values(obj)) {
    if (!isValidTiers(v)) return defaultRowRubric();
  }
  return obj as RowRubricData;
}
