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
  // Display title used by the Preview Rubric view (matches the PDF section
  // heading for that criterion). Falls back to `name` when omitted. The L3
  // prompt continues to use `name` verbatim — drift-guard test enforces this.
  readonly title?: string;
  // PASS / FAIL definitions from the §26.67 SED rubric PDF. Optional so saved
  // rubrics from before these fields were added still validate.
  readonly pass?: string;
  readonly fail?: string;
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
  {
    s_no: 1,
    name: "Meets Requirements of SED (No Race or Sex Presumptions)",
    title: "No Race & Sex Presumptions",
    pass: "Narrative includes individualized examples of social and economic disadvantage without race or sex presumptions.",
    fail: "Narrative includes individualized examples of social and economic disadvantage with race or sex presumptions.",
  },
  {
    s_no: 2,
    name: "Meets Personal Net Worth (PNW < $2.047M)",
    title: "Personal Net Worth (PNW)",
    rule:
      "Review the Excel Cross-Reference Revenue/PNW. HOWEVER, if the 'Narrative Declared PNW' provides a specific number, it OVERRIDES the Excel data.",
    pass: "PNW meets threshold of less than $2.047 million.",
    fail: "PNW does not meet threshold of less than $2.047 million.",
  },
  {
    s_no: 3,
    name: "Meets Disadvantage in American Society",
    title: "Disadvantage in American Society",
    pass: "Narrative provides experience of social and economic disadvantage within American society.",
    fail: "Narrative describes experiences and circumstances of social and economic disadvantage outside American society.",
  },
  {
    s_no: 4,
    name: "Demonstration of Disadvantage (Past Experiences)",
    pass: "Provides clear, specific lived individualized examples of experiences of social and economic disadvantage within American society.",
    fail: "Provides only general statements of social and economic disadvantage without any personal or specific examples.",
  },
  {
    s_no: 5,
    name: "Evidence of Specific Impediments",
    pass: "Narrative describes multiple, fact-based examples of systemic barriers, denied opportunities, and/or economic hardship (education, employment, business, financing).",
    fail: "Mentions barriers in broad/general terms without supporting detail or provides no examples of specific impediments.",
  },
  {
    s_no: 6,
    name: "Link Between Impediments and Harm",
    pass: "Clearly explains how barriers caused direct economic harm; includes detail on type and magnitude (e.g., lost contracts, financial losses, comparative disadvantage).",
    fail: "States economic harm occurred but does not explain connection to barriers or fails to describe explanation of harm.",
  },
  {
    s_no: 7,
    name: "Economic Disadvantage in Fact",
    pass: "Demonstrates with narrative and financial data that they are economically disadvantaged compared to similarly situated non-disadvantaged individuals; evidence is detailed and factual.",
    fail: "Mentions economic disadvantage but provides weak, inconsistent, or no evidence of such disadvantage.",
  },
] as const;
