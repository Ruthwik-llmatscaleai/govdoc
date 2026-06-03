import { loadRubric } from "@/features/rubrics/store";
import { defaultRowRubric, type RowRubricData } from "./rubric-data";
export type { RowRubricData } from "./rubric-data";
export { defaultRowRubric } from "./rubric-data";

function isValidCategory(x: unknown): boolean {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (["1", "2", "3", "4", "5"] as const).some((k) => typeof o[k] === "string");
}

function normalizeTiers(obj: Record<string, unknown>): RowRubricData {
  const out: RowRubricData = {};
  for (const [cat, val] of Object.entries(obj)) {
    if (!val || typeof val !== "object") continue;
    const raw = val as Record<string, unknown>;
    out[cat] = {
      "1": typeof raw["1"] === "string" ? raw["1"] : "",
      "2": typeof raw["2"] === "string" ? raw["2"] : "",
      "3": typeof raw["3"] === "string" ? raw["3"] : "",
      "4": typeof raw["4"] === "string" ? raw["4"] : "",
      "5": typeof raw["5"] === "string" ? raw["5"] : "",
    };
  }
  return out;
}

export async function loadRowRubric(
  rubricId?: string,
  versionId?: string,
): Promise<RowRubricData> {
  const saved = await loadRubric("row-appraisal", rubricId, versionId);
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return defaultRowRubric();
  const obj = saved as Record<string, unknown>;
  for (const v of Object.values(obj)) {
    if (!isValidCategory(v)) return defaultRowRubric();
  }
  return normalizeTiers(obj);
}
