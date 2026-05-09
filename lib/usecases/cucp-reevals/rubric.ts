// Structured CUCP rubric data for UI consumption (Preview Rubric).
//
// This file is intentionally a parallel copy of the rubric text that is
// inlined in the two prompt builders:
//   - prompts/level-2-classify.ts  (5 L2 legal categories)
//   - prompts/level-3-threshold.ts (7 L3 criteria)
//
// The prompt strings are NOT regenerated from this data — they stay
// byte-identical to what the LLM has always seen. The two sources are kept
// in sync by a regression test in rubric.test.ts that asserts every name /
// description / criterion-line from this file appears verbatim in the
// corresponding system prompt. v2 (editable rubrics) will collapse this
// duplication.

export type CucpL2Category = {
  readonly name: string;
  readonly description: string;
};

export type CucpL3Criterion = {
  readonly s_no: number;
  readonly name: string;
  readonly rule?: string;
};

export const CUCP_L2_CATEGORIES: readonly CucpL2Category[] = [
  {
    name: "Social Disadvantage",
    description:
      "Personal experiences of discrimination — bias in contracting, exclusion from networks, personal prejudice",
  },
  {
    name: "Economic Disadvantage",
    description:
      "Capital access barriers — denied loans, bonding difficulties, financial limitations",
  },
  {
    name: "Institutional/Systemic Barrier",
    description:
      "Discriminatory institutional policies — not individual acts, but systemic patterns",
  },
  {
    name: "Ordinary Business Risk",
    description:
      "Setbacks from normal market forces — competition, pricing, general economy",
  },
  {
    name: "Insufficient Evidence",
    description: "The incident lacks enough detail to classify under §26.67",
  },
] as const;

export const CUCP_L3_CRITERIA: readonly CucpL3Criterion[] = [
  { s_no: 1, name: "Meets Requirements of SED (No Race or Sex Presumptions)" },
  {
    s_no: 2,
    name: "Meets Personal Net Worth (PNW < $2.047M)",
    rule:
      "Review the Excel Cross-Reference Revenue/PNW. HOWEVER, if the 'Narrative Declared PNW' provides a specific number, it OVERRIDES the Excel data.",
  },
  { s_no: 3, name: "Meets Disadvantage in American Society" },
  { s_no: 4, name: "Demonstration of Disadvantage (Past Experiences)" },
  { s_no: 5, name: "Evidence of Specific Impediments" },
  { s_no: 6, name: "Link Between Impediments and Harm" },
  { s_no: 7, name: "Economic Disadvantage in Fact" },
] as const;
