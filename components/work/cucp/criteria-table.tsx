"use client";
import { useState } from "react";
import { Check, ListChecks } from "lucide-react";
import type { Criterion, AnalystOverride } from "@/lib/usecases/cucp-reevals/types";
import { PrimaryButton, SecondaryButton } from "@/components/work/form-fields";

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
    if (
      draft.reasoning &&
      draft.reasoning !== c.reasoning &&
      draft.pass_fail === c.pass_fail &&
      draft.request_info === c.request_info
    ) {
      out.push({ s_no: c.s_no, field: "reasoning", value: draft.reasoning, reasoning: draft.reasoning });
    }
  }
  return out;
}

const SELECT_CLASS =
  "h-9 rounded-lg border border-input bg-muted/30 px-2 text-sm transition-colors focus:border-primary/40 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/15";

const INPUT_CLASS =
  "h-9 w-full rounded-lg border border-input bg-muted/30 px-2 text-sm transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/15";

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

  async function postOverrides(overrides: AnalystOverride[]) {
    setSubmitting(true);
    setError(null);
    try {
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
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left p-2">#</th>
              <th className="text-left p-2">Category</th>
              <th className="text-left p-2">Qualification</th>
              <th className="text-left p-2">AI Verdict</th>
              <th className="text-left p-2">Reviewer Pass/Fail</th>
              <th className="text-left p-2">Request Info</th>
              <th className="text-left p-2">Override Reason</th>
            </tr>
          </thead>
          <tbody>
            {criteria.map((c) => {
              const d = drafts[c.s_no]!;
              const changed = d.pass_fail !== c.pass_fail || d.request_info !== c.request_info;
              return (
                <tr
                  key={c.s_no}
                  className={`border-t align-top ${changed ? "bg-amber-50/60" : ""}`}
                >
                  <td className="p-2">{c.s_no}</td>
                  <td className="p-2 font-medium">{c.category}</td>
                  <td className="p-2 text-xs text-muted-foreground max-w-xs">{c.qualification}</td>
                  <td className="p-2">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        c.pass_fail === "Pass"
                          ? "bg-[#d4edda] text-[#155724]"
                          : "bg-[#f8d7da] text-[#721c24]"
                      }`}
                    >
                      {c.pass_fail}
                    </span>
                    <div className="mt-1 text-[11px] text-muted-foreground">{c.reasoning.slice(0, 160)}</div>
                  </td>
                  <td className="p-2">
                    <select
                      aria-label={`Pass/Fail for criterion ${c.s_no}`}
                      value={d.pass_fail}
                      onChange={(e) => update(c.s_no, { pass_fail: e.target.value as "Pass" | "Fail" })}
                      className={SELECT_CLASS}
                    >
                      <option value="Pass">Pass</option>
                      <option value="Fail">Fail</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <select
                      aria-label={`Request info for criterion ${c.s_no}`}
                      value={d.request_info}
                      onChange={(e) => update(c.s_no, { request_info: e.target.value as "Yes" | "No" })}
                      className={SELECT_CLASS}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      aria-label={`Override reasoning for criterion ${c.s_no}`}
                      value={d.reasoning}
                      onChange={(e) => update(c.s_no, { reasoning: e.target.value })}
                      placeholder={changed ? "Required when overriding" : ""}
                      className={INPUT_CLASS}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {error && <div className="text-sm text-destructive">{error}</div>}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <SecondaryButton
          type="button"
          disabled={submitting}
          onClick={() => postOverrides([])}
        >
          <Check className="size-4" /> Approve all (no changes)
        </SecondaryButton>
        <PrimaryButton
          type="button"
          disabled={submitting}
          onClick={() => postOverrides(diffOverrides(criteria, drafts))}
        >
          <ListChecks className="size-4" />
          {submitting ? "Submitting…" : "Submit overrides and finalize"}
        </PrimaryButton>
      </div>
    </div>
  );
}
