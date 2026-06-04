/**
 * Caltrans Project Delivery Selection Matrix — Point-Based Scoring
 *
 * Each question assigns different point values to each of the 6 delivery methods
 * depending on the answer (A, B, or C). The method with the highest total wins.
 *
 * A "No-Go" (-1) answer for a method disqualifies that method entirely.
 *
 * Source: Caltrans "05-0H330_US 101 SOS_Selection Matrix_10-31-2025.xls"
 */

export type DeliveryMethod = "DBB" | "DS" | "DB_LB" | "DB_BV" | "CMGC" | "PDB";

export const METHOD_LABELS: Record<DeliveryMethod, string> = {
  DBB: "Design-Bid-Build",
  DS: "Design-Sequencing",
  DB_LB: "Design-Build/Low Bid",
  DB_BV: "Design-Build/Best-Value",
  CMGC: "CM/GC",
  PDB: "Progressive Design-Build",
};

export const ALL_METHODS: DeliveryMethod[] = ["DBB", "DS", "DB_LB", "DB_BV", "CMGC", "PDB"];

type PointRow = Record<DeliveryMethod, number>;

type QuestionPoints = {
  A: PointRow;
  B: PointRow;
  C: PointRow;
};

/**
 * The full scoring matrix extracted from the Caltrans Excel.
 * -1 means "No-Go" (disqualifies that method).
 * PDB values are same as CMGC except where noted (D2, E1, E2, F2, F3).
 */
export const SCORING_MATRIX: Record<string, QuestionPoints> = {
  A1: {
    A: { DBB: 10, DS:  0, DB_LB: -1, DB_BV: -1, CMGC: -1, PDB: -1 },
    B: { DBB: 10, DS: 10, DB_LB: 10, DB_BV:  5, CMGC:  5, PDB:  5 },
    C: { DBB: 10, DS: 10, DB_LB: 10, DB_BV: 10, CMGC: 10, PDB: 10 },
  },
  A2: {
    A: { DBB: 5, DS: 5, DB_LB: 2, DB_BV: 0, CMGC: 0, PDB: 0 },
    B: { DBB: 3, DS: 3, DB_LB: 5, DB_BV: 2, CMGC: 2, PDB: 2 },
    C: { DBB: 3, DS: 0, DB_LB: 3, DB_BV: 5, CMGC: 5, PDB: 5 },
  },
  A3: {
    A: { DBB: 5, DS: 5, DB_LB: 3, DB_BV: 0, CMGC: 0, PDB: 0 },
    B: { DBB: 2, DS: 2, DB_LB: 5, DB_BV: 3, CMGC: 3, PDB: 3 },
    C: { DBB: 2, DS: 0, DB_LB: 2, DB_BV: 5, CMGC: 5, PDB: 5 },
  },
  A4: {
    A: { DBB: 5, DS: 2, DB_LB: 0, DB_BV: 0, CMGC: 0, PDB: 0 },
    B: { DBB: 0, DS: 5, DB_LB: 5, DB_BV: 5, CMGC: 5, PDB: 5 },
    C: { DBB: 0, DS: 5, DB_LB: 7, DB_BV: 10, CMGC: 10, PDB: 10 },
  },
  A5: {
    A: { DBB: 5, DS: 5, DB_LB: 0, DB_BV: 0, CMGC: 0, PDB: 0 },
    B: { DBB: 0, DS: 2, DB_LB: 5, DB_BV: 5, CMGC: 5, PDB: 5 },
    C: { DBB: 0, DS: 2, DB_LB: 7, DB_BV: 10, CMGC: 10, PDB: 10 },
  },
  A6: {
    A: { DBB: 5, DS: 5, DB_LB: 0, DB_BV: 0, CMGC: 0, PDB: 0 },
    B: { DBB: 0, DS: 2, DB_LB: 5, DB_BV: 5, CMGC: 5, PDB: 5 },
    C: { DBB: 0, DS: 2, DB_LB: 7, DB_BV: 10, CMGC: 10, PDB: 10 },
  },
  A7: {
    A: { DBB: 5, DS: 5, DB_LB: 0, DB_BV: 0, CMGC: 5, PDB: 5 },
    B: { DBB: 0, DS: 2, DB_LB: 5, DB_BV: 5, CMGC: 5, PDB: 5 },
    C: { DBB: 0, DS: 2, DB_LB: 10, DB_BV: 10, CMGC: 10, PDB: 10 },
  },
  A8: {
    A: { DBB: 5, DS: 5, DB_LB: 0, DB_BV: 0, CMGC: 0, PDB: 0 },
    B: { DBB: 0, DS: 2, DB_LB: 5, DB_BV: 5, CMGC: 5, PDB: 5 },
    C: { DBB: 0, DS: 2, DB_LB: 10, DB_BV: 10, CMGC: 10, PDB: 10 },
  },
  A9: {
    A: { DBB: 5, DS: 5, DB_LB: 0, DB_BV: 0, CMGC: 5, PDB: 5 },
    B: { DBB: 0, DS: 0, DB_LB: 5, DB_BV: 5, CMGC: 10, PDB: 10 },
    C: { DBB: 0, DS: 0, DB_LB: 10, DB_BV: 10, CMGC: 10, PDB: 10 },
  },
  A10: {
    A: { DBB: 5, DS: 0, DB_LB: 0, DB_BV: 0, CMGC: 0, PDB: 0 },
    B: { DBB: 0, DS: 5, DB_LB: 5, DB_BV: 5, CMGC: 5, PDB: 5 },
    C: { DBB: 0, DS: 5, DB_LB: 10, DB_BV: 10, CMGC: 10, PDB: 10 },
  },
  B1: {
    A: { DBB: 5, DS: 0, DB_LB: 0, DB_BV: 0, CMGC: 0, PDB: 0 },
    B: { DBB: 0, DS: 2, DB_LB: 2, DB_BV: 3, CMGC: 2, PDB: 2 },
    C: { DBB: 0, DS: 5, DB_LB: 5, DB_BV: 6, CMGC: 5, PDB: 5 },
  },
  B2: {
    A: { DBB: 5, DS: 0, DB_LB: 0, DB_BV: 0, CMGC: 0, PDB: 0 },
    B: { DBB: 0, DS: 2, DB_LB: 2, DB_BV: 3, CMGC: 2, PDB: 2 },
    C: { DBB: 0, DS: 5, DB_LB: 5, DB_BV: 6, CMGC: 5, PDB: 5 },
  },
  C1: {
    A: { DBB: 5, DS: 2, DB_LB: 2, DB_BV: 0, CMGC: 0, PDB: 0 },
    B: { DBB: 0, DS: 2, DB_LB: 2, DB_BV: 2, CMGC: 2, PDB: 2 },
    C: { DBB: 0, DS: 2, DB_LB: 5, DB_BV: 5, CMGC: 5, PDB: 5 },
  },
  C2: {
    A: { DBB: 5, DS: 5, DB_LB: 2, DB_BV: 2, CMGC: 5, PDB: 5 },
    B: { DBB: 0, DS: 2, DB_LB: 5, DB_BV: 5, CMGC: 5, PDB: 5 },
    C: { DBB: 0, DS: 0, DB_LB: 2, DB_BV: 5, CMGC: 2, PDB: 2 },
  },
  D1: {
    A: { DBB: 5, DS: 2, DB_LB: 0, DB_BV: 0, CMGC: 0, PDB: 0 },
    B: { DBB: 0, DS: 2, DB_LB: 2, DB_BV: 5, CMGC: 5, PDB: 5 },
    C: { DBB: 0, DS: 2, DB_LB: 2, DB_BV: 5, CMGC: 5, PDB: 5 },
  },
  D2: {
    A: { DBB: 5, DS: 2, DB_LB: 0, DB_BV: 0, CMGC: 0, PDB: 0 },
    B: { DBB: 0, DS: 2, DB_LB: 2, DB_BV: 5, CMGC: 2, PDB: 3 },
    C: { DBB: 0, DS: 2, DB_LB: 2, DB_BV: 5, CMGC: 5, PDB: 5 },
  },
  D3: {
    A: { DBB: 5, DS: 5, DB_LB: 2, DB_BV: 0, CMGC: 0, PDB: 0 },
    B: { DBB: 0, DS: 0, DB_LB: 2, DB_BV: 5, CMGC: 5, PDB: 5 },
    C: { DBB: 0, DS: 0, DB_LB: 2, DB_BV: 5, CMGC: 5, PDB: 5 },
  },
  E1: {
    A: { DBB: 5, DS: 3, DB_LB: 1, DB_BV: 0, CMGC: 0, PDB: 0 },
    B: { DBB: 0, DS: 2, DB_LB: 2, DB_BV: 5, CMGC: 2, PDB: 5 },
    C: { DBB: 0, DS: 2, DB_LB: 5, DB_BV: 5, CMGC: 5, PDB: 5 },
  },
  E2: {
    A: { DBB: 5, DS: 5, DB_LB: 1, DB_BV: 0, CMGC: 0, PDB: 0 },
    B: { DBB: 0, DS: 1, DB_LB: 2, DB_BV: 5, CMGC: 5, PDB: 5 },
    C: { DBB: 0, DS: 1, DB_LB: 5, DB_BV: 5, CMGC: 5, PDB: 5 },
  },
  E3: {
    A: { DBB: 5, DS: 2, DB_LB: 1, DB_BV: 0, CMGC: 0, PDB: 0 },
    B: { DBB: 0, DS: 2, DB_LB: 2, DB_BV: 2, CMGC: 2, PDB: 2 },
    C: { DBB: 0, DS: 3, DB_LB: 3, DB_BV: 5, CMGC: 5, PDB: 5 },
  },
  E4: {
    A: { DBB: 5, DS: 3, DB_LB: 1, DB_BV: 0, CMGC: 5, PDB: 5 },
    B: { DBB: 2, DS: 2, DB_LB: 2, DB_BV: 2, CMGC: 2, PDB: 2 },
    C: { DBB: 0, DS: 0, DB_LB: 0, DB_BV: 5, CMGC: 0, PDB: 0 },
  },
  E5: {
    A: { DBB: 5, DS: 5, DB_LB: 5, DB_BV: 5, CMGC: 0, PDB: 0 },
    B: { DBB: 0, DS: 0, DB_LB: 0, DB_BV: 0, CMGC: 2, PDB: 2 },
    C: { DBB: 0, DS: 0, DB_LB: 0, DB_BV: 0, CMGC: 5, PDB: 5 },
  },
  F1: {
    A: { DBB: 5, DS: 2, DB_LB: 0, DB_BV: 0, CMGC: 0, PDB: 0 },
    B: { DBB: 0, DS: 0, DB_LB: 2, DB_BV: 2, CMGC: 2, PDB: 2 },
    C: { DBB: 0, DS: 0, DB_LB: 2, DB_BV: 5, CMGC: 5, PDB: 5 },
  },
  F2: {
    A: { DBB: 5, DS: 5, DB_LB: 2, DB_BV: 2, CMGC: 5, PDB: 2 },
    B: { DBB: 0, DS: 0, DB_LB: 3, DB_BV: 5, CMGC: 0, PDB: 0 },
    C: { DBB: -1, DS: -1, DB_LB: 5, DB_BV: 5, CMGC: 0, PDB: 0 },
  },
  F3: {
    A: { DBB: 5, DS: 5, DB_LB: 2, DB_BV: 2, CMGC: 2, PDB: 2 },
    B: { DBB: 2, DS: 2, DB_LB: 3, DB_BV: 5, CMGC: 5, PDB: 5 },
    C: { DBB: -1, DS: -1, DB_LB: 5, DB_BV: 5, CMGC: 5, PDB: 5 },
  },
};

export type Rating = "A" | "B" | "C";

export type MethodScore = {
  method: DeliveryMethod;
  label: string;
  total: number;
  worksheet1: number;
  worksheet2: number;
  noGo: boolean;
  noGoQuestions: string[];
};

export type MatrixResult = {
  method_scores: MethodScore[];
  recommended: DeliveryMethod;
  recommended_label: string;
  recommended_total: number;
  runner_up: DeliveryMethod | null;
  runner_up_label: string | null;
  runner_up_total: number | null;
  per_question: Record<string, Record<DeliveryMethod, number>>;
  no_go_methods: DeliveryMethod[];
};

const WS1_QUESTIONS = new Set(["A1","A2","A3","A4","A5","A6","A7","A8","A9","A10"]);

export function computeMatrixScores(ratings: Record<string, Rating>): MatrixResult {
  const perQuestion: Record<string, Record<DeliveryMethod, number>> = {};
  const totals: Record<DeliveryMethod, number> = { DBB: 0, DS: 0, DB_LB: 0, DB_BV: 0, CMGC: 0, PDB: 0 };
  const ws1Totals: Record<DeliveryMethod, number> = { DBB: 0, DS: 0, DB_LB: 0, DB_BV: 0, CMGC: 0, PDB: 0 };
  const ws2Totals: Record<DeliveryMethod, number> = { DBB: 0, DS: 0, DB_LB: 0, DB_BV: 0, CMGC: 0, PDB: 0 };
  const noGoMap: Record<DeliveryMethod, string[]> = { DBB: [], DS: [], DB_LB: [], DB_BV: [], CMGC: [], PDB: [] };

  for (const [qid, points] of Object.entries(SCORING_MATRIX)) {
    const answer = ratings[qid] ?? "B";
    const row = points[answer];
    perQuestion[qid] = { ...row };

    const isWs1 = WS1_QUESTIONS.has(qid);
    for (const method of ALL_METHODS) {
      const pts = row[method];
      if (pts === -1) {
        noGoMap[method].push(qid);
      } else {
        totals[method] += pts;
        if (isWs1) ws1Totals[method] += pts;
        else ws2Totals[method] += pts;
      }
    }
  }

  const methodScores: MethodScore[] = ALL_METHODS.map((m) => ({
    method: m,
    label: METHOD_LABELS[m],
    total: totals[m],
    worksheet1: ws1Totals[m],
    worksheet2: ws2Totals[m],
    noGo: noGoMap[m].length > 0,
    noGoQuestions: noGoMap[m],
  }));

  methodScores.sort((a, b) => {
    if (a.noGo && !b.noGo) return 1;
    if (!a.noGo && b.noGo) return -1;
    return b.total - a.total;
  });

  const eligible = methodScores.filter((m) => !m.noGo);
  const recommended = eligible[0] ?? methodScores[0]!;
  const runnerUp = eligible[1] ?? null;

  return {
    method_scores: methodScores,
    recommended: recommended.method,
    recommended_label: recommended.label,
    recommended_total: recommended.total,
    runner_up: runnerUp?.method ?? null,
    runner_up_label: runnerUp?.label ?? null,
    runner_up_total: runnerUp?.total ?? null,
    per_question: perQuestion,
    no_go_methods: methodScores.filter((m) => m.noGo).map((m) => m.method),
  };
}
