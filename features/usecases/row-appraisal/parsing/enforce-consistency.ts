import type { EvaluationResult } from "../types";

export function enforceConsistency(results: EvaluationResult[], documentText = ""): EvaluationResult[] {
  const out = results.map((r) => ({ ...r }));
  const bycat = new Map(out.map((r) => [r.category, r]));

  // Rule 1: Certificate of Appraiser score=1 → force Delegations to score=1
  const cert = bycat.get("Certificate of Appraiser");
  const deleg = bycat.get("Delegations");
  if (cert && deleg && cert.score === 1 && deleg.score !== 1) {
    deleg.score = 1;
    deleg.status = "❌ Fail";
    deleg.criteria_met =
      "Report does not follow correct delegations or does not contain correct signatures.";
    deleg.comments =
      `Enforced by consistency check: Certificate of Appraiser scored 1 (missing certificate). ` +
      `A missing certificate is a delegation violation. Original model comment: ${deleg.comments}`;
  }

  // Rule 2: HABU Improved=N/A → force HABU Reconciliation to N/A
  const habi = bycat.get("HABU Improved");
  const habr = bycat.get("HABU Reconciliation");
  if (habi && habr && habi.score === -1 && habr.score !== -1) {
    habr.score = -1;
    habr.status = "⚪ N/A";
    habr.criteria_met =
      "HABU Reconciliation is only done when a HABU improved was performed. Otherwise report N/A.";
    habr.comments =
      `Enforced by consistency check: HABU Improved is N/A (property not improved with a building), ` +
      `so HABU Reconciliation is automatically N/A.`;
  }

  // Rule 3: HABU Vacant score>=4 but comments/evidence admit buyer not stated → downgrade to 3
  const habv = bycat.get("HABU Vacant");
  if (habv && habv.score >= 4) {
    const combined = `${habv.comments} ${habv.evidence}`.toLowerCase();
    const buyerMissingSignals = [
      "most likely buyer is not explicitly stated",
      "most likely buyer is implied",
      "most likely buyer not explicitly",
      "buyer is not explicitly",
      "buyer is implied",
      "buyer is not stated",
    ];
    if (buyerMissingSignals.some((s) => combined.includes(s))) {
      habv.score = 3;
      habv.status = "⚠️ Warning";
      habv.criteria_met =
        "Contains the dictionary of real estate definition of HABU. Analyzes the zoning, general plan, CCRs, and other restrictions or probable uses of the parcels legal use; then has an analysis on the parcels topography, size, and other physical characteristics for the remaining legal uses; then has an analysis based on market demand on the remaining uses that are financially feasible; and finally a statement of which use is maximally productive and why.";
      habv.comments =
        `Enforced by consistency check: Score 4/5 requires an EXPLICIT most likely buyer statement. ` +
        `Original comments indicated this was missing or only implied, which fails the Score 4 prerequisite. ` +
        `Downgraded to Score 3 (concludes maximally productive use but no explicit buyer identification).`;
    }
  }

  // Rule 4: Contingency-fee red-flag detector (Caltrans R/W Manual Ch 7)
  if (documentText) {
    const textLower = documentText.toLowerCase();
    const contingencySignals = ["contingency fee", "contingent fee", "contingency compensation"];
    let contingencyFound = contingencySignals.some((s) => textLower.includes(s));

    if (!contingencyFound && textLower.includes("contingency")) {
      const matches = [...textLower.matchAll(/contingency/g)];
      for (const m of matches) {
        const start = Math.max(0, m.index! - 200);
        const end = Math.min(textLower.length, m.index! + 200);
        const window = textLower.slice(start, end);
        if (["damage", "compensation", "after analysis", "cost to cure", "remainder"].some((kw) => window.includes(kw))) {
          contingencyFound = true;
          break;
        }
      }
    }

    if (contingencyFound) {
      for (const catName of ["After Analysis (if required)", "Cost to Cure"]) {
        const target = bycat.get(catName);
        if (target && target.score !== 1 && target.score !== -1) {
          target.score = 1;
          target.status = "❌ Fail";
          target.criteria_met =
            "Fails per Caltrans R/W Manual Chapter 7 — contingency fees in damages are prohibited.";
          target.comments =
            `Enforced by Rule 4 (contingency-fee red-flag detector). The document text ` +
            `contains 'contingency' language in damages context. Per Caltrans R/W Manual Chapter 7, ` +
            `contingency fees cannot be paid as damages. Original: ${target.comments}`;
        }
      }
    }
  }

  return out;
}
