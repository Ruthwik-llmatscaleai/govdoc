// Lightweight intent detection for routing chat questions to the curated
// Sunnyvale Finance Knowledge Base. Keyword heuristic only — zero latency/cost,
// deterministic, and unit-testable. The query embedding is accepted (unused today)
// so a semantic second gate can be added later without changing the call site.

const CITY_TERMS = [
  "sunnyvale",
  "city budget",
  "the city",
  "city of sunnyvale",
];

const FINANCE_TERMS = [
  "budget",
  "spend",
  "spending",
  "expense",
  "expenses",
  "expenditure",
  "expenditures",
  "revenue",
  "revenues",
  "forecast",
  "forecasting",
  "appropriation",
  "appropriations",
  "capital",
  "fund",
  "funds",
  "funding",
  "fiscal",
  "cip",
  "operating budget",
  "deficit",
  "surplus",
  "reserve",
  "reserves",
  "tax",
  "taxes",
];

// Signals that the user is asking about THEIR OWN uploaded document — never route
// these to the shared KB; the existing upload path should handle them.
const UPLOAD_REFERENCE_TERMS = [
  "my document",
  "my doc",
  "my file",
  "uploaded",
  "upload",
  "this file",
  "this document",
  "this pdf",
  "attached",
  "the doc i",
  "the pdf i",
  "the file i",
];

function includesAny(haystack: string, terms: string[]): boolean {
  return terms.some((t) => haystack.includes(t));
}

/**
 * Returns true when a chat question should be answered from the Sunnyvale Finance
 * Knowledge Base.
 *
 * Routes when the city is named, OR a finance term appears and the question does
 * not explicitly reference the user's own uploaded document.
 *
 * @param _queryEmbedding reserved for a future semantic gate (currently unused)
 */
export function detectFinanceIntent(question: string, _queryEmbedding?: number[]): boolean {
  const q = question.toLowerCase();

  if (includesAny(q, UPLOAD_REFERENCE_TERMS)) return false;

  if (includesAny(q, CITY_TERMS)) return true;

  return includesAny(q, FINANCE_TERMS);
}
