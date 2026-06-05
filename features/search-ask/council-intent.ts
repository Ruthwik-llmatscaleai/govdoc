// Intent detection for routing chat questions to the Sunnyvale City Council
// caption-notes KB ("sunnyvale-council"). Keyword heuristic, deterministic.
//
// Design note: bare "council" is NOT a trigger (it collides with finance, e.g.
// "city council budget"). We route to council only on a deliberation signal
// (said/discussed/motion/vote/agenda/minutes/meeting...) or a specific meeting
// body name. So "what did the council decide about X" -> council, while
// "city council budget" -> finance.

export const COUNCIL_BODIES = [
  "city council",
  "planning commission",
  "bicycle and pedestrian advisory commission",
  "charter review committee",
  "sustainability commission",
  "human relations commission",
  "board of library trustees",
  "arts commission",
  "housing and human services commission",
  "parks and recreation commission",
  "heritage preservation commission",
  "community event and neighborhood grant distribution subcommittee",
];

const DELIBERATION_TERMS = [
  "meeting",
  "meetings",
  "commission",
  "committee",
  "subcommittee",
  "trustees",
  "minutes",
  "agenda",
  "motion",
  "vote",
  "voted",
  "said",
  "say",
  "discuss",
  "discussed",
  "decide",
  "decided",
  "decision",
  "public comment",
  "roll call",
  "hearing",
  "testimony",
  "caption notes",
  "transcript",
  "deliberation",
  "resolution",
  "ordinance",
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

/** Returns true when a question should be answered from the council meeting transcripts. */
export function detectCouncilIntent(question: string): boolean {
  const q = question.toLowerCase();
  if (includesAny(q, UPLOAD_REFERENCE_TERMS)) return false;
  if (includesAny(q, COUNCIL_BODIES)) return true;
  return includesAny(q, DELIBERATION_TERMS);
}

/** The specific meeting body named in the question, if any (for future filtering). */
export function detectBody(question: string): string | undefined {
  const q = question.toLowerCase();
  return COUNCIL_BODIES.find((b) => q.includes(b));
}
