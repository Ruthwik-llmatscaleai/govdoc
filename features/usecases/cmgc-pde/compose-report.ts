import type { CmgcRunResult } from "./types";
import { ALL_METHODS } from "./scoring/point-matrix";

export type ReportOverride = {
  question_id: string;
  oldValue: string;
  newValue: string;
  reason: string;
};

export function composeCmgcReport(
  result: CmgcRunResult,
  overrides: readonly ReportOverride[] = [],
): string {
  const { evaluation, recommendation, matrix } = result;
  const lines: string[] = [];

  lines.push(`# Project Delivery Evaluation`);
  if (evaluation.project_name) lines.push(`**Project:** ${evaluation.project_name}`);
  if (evaluation.evaluation_date) lines.push(`**Date:** ${evaluation.evaluation_date}`);
  lines.push(``);

  lines.push(`## Recommendation`);
  lines.push(``);
  if (matrix) {
    lines.push(`**Recommended method:** ${matrix.recommended_label}`);
    lines.push(`**Score:** ${matrix.recommended_total} pts`);
    if (matrix.runner_up_label) {
      lines.push(`**Runner-up:** ${matrix.runner_up_label} (${matrix.runner_up_total} pts)`);
    }
    if (matrix.no_go_methods.length > 0) {
      lines.push(`**No-Go:** ${matrix.no_go_methods.join(", ")}`);
    }
  } else {
    lines.push(`**Recommended method:** ${recommendation.recommended_method ?? "—"}`);
  }
  lines.push(``);

  if (evaluation.summary?.trim()) {
    lines.push(`## Summary`);
    lines.push(``);
    lines.push(evaluation.summary.trim());
    lines.push(``);
  }

  if (recommendation.override_reasons?.length > 0) {
    lines.push(`## Rule-based overrides applied`);
    lines.push(``);
    for (const r of recommendation.override_reasons) {
      lines.push(`- ${r}`);
    }
    lines.push(``);
  }

  if (overrides.length > 0) {
    lines.push(`## Human overrides (HIFL)`);
    lines.push(``);
    lines.push(`| Question | Change | Reason |`);
    lines.push(`|---|---|---|`);
    for (const o of overrides) {
      const reason = (o.reason ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
      lines.push(`| ${o.question_id} | ${o.oldValue} → ${o.newValue} | ${reason} |`);
    }
    lines.push(``);
  }

  if (matrix) {
    lines.push(`## Selection Matrix Scores`);
    lines.push(``);
    lines.push(`| Method | WS1 | WS2 | Total | Status |`);
    lines.push(`|---|---|---|---|---|`);
    for (const method of ALL_METHODS) {
      const m = matrix.method_scores.find((ms) => ms.method === method);
      if (!m) continue;
      const status = m.noGo ? `No-Go (${m.noGoQuestions.join(", ")})` : "Eligible";
      lines.push(`| ${m.label} | ${m.worksheet1} | ${m.worksheet2} | **${m.total}** | ${status} |`);
    }
    lines.push(``);
  }

  return lines.join("\n").trim();
}
