export type Precedent = {
  target: string;
  correction: string;
  human_reasoning: string;
  fact_id?: string;   // L2 only — links to the fact that was reclassified
  s_no?: number;      // L3 only — links to the criterion row
};

export type Level = 1 | 2 | 3;

export type PrecedentsByLevel = {
  level_1_precedents: Precedent[];
  level_2_precedents: Precedent[];
  level_3_precedents: Precedent[];
};

export const EMPTY_PRECEDENTS: PrecedentsByLevel = {
  level_1_precedents: [],
  level_2_precedents: [],
  level_3_precedents: [],
};

// Block-format strings are verbatim from caltrans/src/cucp_reevals.py:28,107,170 — DO NOT reword.
export function buildPrecedentsBlock(
  level: Level,
  precedents: readonly Precedent[],
): string {
  if (precedents.length === 0) return "";

  const lines = precedents.map((p) => {
    if (level === 1) {
      return `- If you see '${p.target}', apply correction: '${p.correction}'. Reason: ${p.human_reasoning}`;
    }
    if (level === 2) {
      return `- Scenario: '${p.target}' -> Classify as: '${p.correction}'. Reason: ${p.human_reasoning}`;
    }
    return `- Correction for '${p.target}': ${p.correction}. Reason: ${p.human_reasoning}`;
  });

  return `\n\nINSTITUTIONAL MEMORY - LEVEL ${level} HUMAN CORRECTIONS:\n${lines.join("\n")}`;
}
