import { RUBRIC_QUESTIONS, SECTION_WEIGHTS, type RubricQuestion } from "./rubric";
import { loadSavedRubric } from "../rubric-store";

export type CmgcRubricData = {
  questions: readonly RubricQuestion[];
  weights: Readonly<Record<"A" | "B" | "C" | "D" | "E" | "F", number>>;
};

export function defaultCmgcRubric(): CmgcRubricData {
  return { questions: RUBRIC_QUESTIONS, weights: SECTION_WEIGHTS };
}

function isValidQuestion(q: unknown): q is RubricQuestion {
  if (!q || typeof q !== "object") return false;
  const o = q as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.section === "string" &&
    typeof o.question === "string" &&
    typeof o.option_a === "string" &&
    typeof o.option_b === "string" &&
    typeof o.option_c === "string"
  );
}

function isValidWeights(w: unknown): w is CmgcRubricData["weights"] {
  if (!w || typeof w !== "object") return false;
  const o = w as Record<string, unknown>;
  return (["A", "B", "C", "D", "E", "F"] as const).every(
    (k) => typeof o[k] === "number",
  );
}

export async function loadCmgcRubric(): Promise<CmgcRubricData> {
  const saved = await loadSavedRubric("cmgc-pde");
  if (!saved || typeof saved !== "object") return defaultCmgcRubric();
  const obj = saved as { questions?: unknown; weights?: unknown };
  if (!Array.isArray(obj.questions) || !obj.questions.every(isValidQuestion)) {
    return defaultCmgcRubric();
  }
  if (!isValidWeights(obj.weights)) return defaultCmgcRubric();
  return { questions: obj.questions, weights: obj.weights };
}
