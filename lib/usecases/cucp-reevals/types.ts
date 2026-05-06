export type ExtractedFact = {
  id: string;
  when: string;
  where: string;
  who: string;
  what: string;
  why: string;
  magnitude: string;
  demographic_flag: boolean;
  source_quote: string;
};

export type Level1Data = {
  firm_name: string;
  cross_reference_result: string;
  narrative_pnw: string;
  extracted_facts: ExtractedFact[];
  error?: string;
};

export type Classification = {
  fact_id: string;
  classification:
    | "Social Disadvantage"
    | "Economic Disadvantage"
    | "Institutional/Systemic Barrier"
    | "Ordinary Business Risk"
    | "Insufficient Evidence";
  summary: string;
  reasoning: string;
};

export type Level2Data = { classifications: Classification[]; error?: string };

export type Criterion = {
  s_no: number;
  category: string;
  qualification: string;
  rule_requires: string;
  evidence_summary: string;
  reasoning: string;
  pass_fail: "Pass" | "Fail";
  request_info: "Yes" | "No";
  confidence: number;
};

export type Level3Data = {
  criteria: Criterion[];
  final_decision: "Yes" | "No" | "Not eligible at this time (pending additional information)";
  certifier_comments: string;
  error?: string;
};

export type AnalystOverride = {
  s_no: number;
  field: "pass_fail" | "request_info" | "reasoning";
  value: string;
  reasoning: string;
};

export type CucpRunResult = {
  level1: Level1Data;
  level2: Level2Data;
  level3: Level3Data;
  analyst_overrides: AnalystOverride[];
  markdown_report: string;
  evaluation_date: string;
};
