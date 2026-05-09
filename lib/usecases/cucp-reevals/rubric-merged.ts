import {
  CUCP_L2_CATEGORIES,
  CUCP_L3_CRITERIA,
  type CucpL2Category,
  type CucpL3Criterion,
} from "./rubric";
import { loadSavedRubric } from "../rubric-store";

export type CucpRubricData = {
  l2: readonly CucpL2Category[];
  l3: readonly CucpL3Criterion[];
};

export function defaultCucpRubric(): CucpRubricData {
  return { l2: CUCP_L2_CATEGORIES, l3: CUCP_L3_CRITERIA };
}

function isValidL2(x: unknown): x is CucpL2Category {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return typeof o.name === "string" && typeof o.description === "string";
}

function isValidL3(x: unknown): x is CucpL3Criterion {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.s_no === "number" &&
    typeof o.name === "string" &&
    (o.rule === undefined || typeof o.rule === "string")
  );
}

export async function loadCucpRubric(): Promise<CucpRubricData> {
  const saved = await loadSavedRubric("cucp-reevals");
  if (!saved || typeof saved !== "object") return defaultCucpRubric();
  const obj = saved as { l2?: unknown; l3?: unknown };
  if (!Array.isArray(obj.l2) || !obj.l2.every(isValidL2)) return defaultCucpRubric();
  if (!Array.isArray(obj.l3) || !obj.l3.every(isValidL3)) return defaultCucpRubric();
  return { l2: obj.l2, l3: obj.l3 };
}
