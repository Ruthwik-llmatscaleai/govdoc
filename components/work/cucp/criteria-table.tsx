"use client";
import { useState } from "react";
import type { Criterion, AnalystOverride } from "@/lib/usecases/cucp-reevals/types";

type Props = {
  criteria: Criterion[];
  runId: string;
  onSubmitted?: () => void;
};

type RowDraft = {
  pass_fail: "Pass" | "Fail";
  request_info: "Yes" | "No";
  reasoning: string;
};

function diffOverrides(criteria: Criterion[], drafts: Record<number, RowDraft>): AnalystOverride[] {
  const out: AnalystOverride[] = [];
  for (const c of criteria) {
    const draft = drafts[c.s_no];
    if (!draft) continue;
    if (draft.pass_fail !== c.pass_fail) {
      out.push({ s_no: c.s_no, field: "pass_fail", value: draft.pass_fail, reasoning: draft.reasoning });
    }
    if (draft.request_info !== c.request_info) {
      out.push({ s_no: c.s_no, field: "request_info", value: draft.request_info, reasoning: draft.reasoning });
    }
    if (draft.reasoning && draft.reasoning !== c.reasoning && draft.pass_fail === c.pass_fail && draft.request_info === c.request_info) {
      out.push({ s_no: c.s_no, field: "reasoning", value: draft.reasoning, reasoning: draft.reasoning });
    }
  }
  return out;
}

export function CriteriaTable({ criteria, runId, onSubmitted }: Props) {
  const [drafts, setDrafts] = useState<Record<number, RowDraft>>(() => {
    const initial: Record<number, RowDraft> = {};
    for (const c of criteria) {
      initial[c.s_no] = { pass_fail: c.pass_fail, request_info: c.request_info, reasoning: "" };
    }
    return initial;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(s_no: number, patch: Partial<RowDraft>) {
    setDrafts((prev) => ({ ...prev, [s_no]: { ...prev[s_no]!, ...patch } }));
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const overrides = diffOverrides(criteria, drafts);
      const res = await fetch(`/api/usecases/cucp-reevals/run/${runId}/respond`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ overrides }),
      });
      if (!res.ok) {
        setError(`Submit failed (${res.status})`);
        return;
      }
      onSubmitted?.();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <table className="min-w-full border">
        <thead>
          <tr>
            <th className="text-left p-2 border">#</th>
            <th className="text-left p-2 border">Category</th>
            <th className="text-left p-2 border">Qualification</th>
            <th className="text-left p-2 border">Pass/Fail</th>
            <th className="text-left p-2 border">Request Info</th>
            <th className="text-left p-2 border">AI Reasoning</th>
            <th className="text-left p-2 border">Override Reason</th>
          </tr>
        </thead>
        <tbody>
          {criteria.map((c) => {
            const d = drafts[c.s_no]!;
            return (
              <tr key={c.s_no}>
                <td className="p-2 border">{c.s_no}</td>
                <td className="p-2 border">{c.category}</td>
                <td className="p-2 border">{c.qualification}</td>
                <td className="p-2 border">
                  <select
                    aria-label={`Pass/Fail for criterion ${c.s_no}`}
                    value={d.pass_fail}
                    onChange={(e) => update(c.s_no, { pass_fail: e.target.value as "Pass" | "Fail" })}
                  >
                    <option value="Pass">Pass</option>
                    <option value="Fail">Fail</option>
                  </select>
                </td>
                <td className="p-2 border">
                  <select
                    aria-label={`Request info for criterion ${c.s_no}`}
                    value={d.request_info}
                    onChange={(e) => update(c.s_no, { request_info: e.target.value as "Yes" | "No" })}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </td>
                <td className="p-2 border text-xs">{c.reasoning.slice(0, 200)}</td>
                <td className="p-2 border">
                  <input
                    type="text"
                    aria-label={`Override reasoning for criterion ${c.s_no}`}
                    value={d.reasoning}
                    onChange={(e) => update(c.s_no, { reasoning: e.target.value })}
                    placeholder="Required if overriding"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <button type="button" onClick={submit} disabled={submitting}>
        {submitting ? "Submitting…" : "Submit overrides and finalize"}
      </button>
    </div>
  );
}
