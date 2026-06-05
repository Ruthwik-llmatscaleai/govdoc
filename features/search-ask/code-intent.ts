// Intent detection for routing chat questions to the Sunnyvale Municipal Code KB
// ("sunnyvale-municode"). Keyword heuristic, deterministic. Uses code-specific
// terms (building code / zoning / permit / section symbol) so it doesn't collide
// with finance ("budget") or council ("meeting/ordinance") routing.

const CODE_TERMS = [
  "building code",
  "municipal code",
  "muni code",
  "smc ",
  "zoning",
  "rezone",
  "setback",
  "variance",
  "permit",
  "permitted",
  "land use",
  "easement",
  "encroachment",
  "code section",
  "code chapter",
  "§",
  "what does the code",
  "is it legal",
  "building height",
  "lot coverage",
  "accessory dwelling",
  "adu",
  // General Provisions / code-enforcement vocabulary (Title 1 et al.)
  "citation",
  "administrative citation",
  "penalty",
  "violation",
  "nuisance",
  "misdemeanor",
  "infraction",
  "ordinance",
  "abatement",
  "code enforcement",
  "enforcement officer",
  "compliance order",
  "hearing officer",
  "fine amount",
  "fines",
];

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
];

function includesAny(haystack: string, terms: string[]): boolean {
  return terms.some((t) => haystack.includes(t));
}

/** Returns true when a question should be answered from the Municipal Code KB. */
export function detectCodeIntent(question: string): boolean {
  const q = question.toLowerCase();
  if (includesAny(q, UPLOAD_REFERENCE_TERMS)) return false;
  return includesAny(q, CODE_TERMS);
}
