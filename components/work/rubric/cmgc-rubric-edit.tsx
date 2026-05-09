"use client";
import { useState } from "react";
import type { CmgcRubricData } from "@/lib/usecases/cmgc-pde/rubric-merged";
import { defaultCmgcRubric } from "@/lib/usecases/cmgc-pde/rubric-merged";
import type { RubricQuestion } from "@/lib/usecases/cmgc-pde/rubric";

const SECTION_KEYS = ["A", "B", "C", "D", "E", "F"] as const;

export function CmgcRubricEdit({ initial }: { initial: CmgcRubricData }) {
  const [questions, setQuestions] = useState<RubricQuestion[]>(() =>
    initial.questions.map((q) => ({ ...q })),
  );
  const [weights, setWeights] = useState<CmgcRubricData["weights"]>(() => ({ ...initial.weights }));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const bySection = new Map<string, { idx: number; q: RubricQuestion }[]>();
  questions.forEach((q, idx) => {
    const arr = bySection.get(q.section) ?? [];
    arr.push({ idx, q });
    bySection.set(q.section, arr);
  });

  function updateOption(idx: number, field: "option_a" | "option_b" | "option_c", value: string) {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q)));
  }

  function updateWeight(key: (typeof SECTION_KEYS)[number], value: string) {
    const num = Number(value);
    if (Number.isNaN(num)) return;
    setWeights((prev) => ({ ...prev, [key]: num }));
  }

  async function onSave() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/usecases/cmgc-pde/rubric", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ questions, weights }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMsg("Saved. Preview rubrics will reflect this on next load.");
    } catch (e) {
      setMsg(`Save failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  async function onReset() {
    if (!confirm("Reset CMGC rubric to defaults? This deletes any saved edits.")) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/usecases/cmgc-pde/rubric", { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const def = defaultCmgcRubric();
      setQuestions(def.questions.map((q) => ({ ...q })));
      setWeights({ ...def.weights });
      setMsg("Reset to defaults.");
    } catch (e) {
      setMsg(`Reset failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Section weights (0–1, must sum to 1)
        </div>
        <div className="flex flex-wrap gap-3">
          {SECTION_KEYS.map((k) => (
            <label key={k} className="flex items-center gap-2 text-sm">
              <span className="font-mono font-semibold text-foreground">{k}</span>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={weights[k]}
                onChange={(e) => updateWeight(k, e.target.value)}
                className="w-20 rounded-md border border-border bg-background px-2 py-1 text-sm"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {Array.from(bySection.entries()).map(([section, items], i) => (
          <details key={section} open={i === 0} className="group rounded-2xl border border-border bg-card">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 text-base font-semibold text-foreground">
              <span>{section}</span>
              <span className="text-xs font-medium text-muted-foreground">
                {items.length} question{items.length === 1 ? "" : "s"} ▾
              </span>
            </summary>
            <div className="space-y-6 border-t border-border p-5">
              {items.map(({ idx, q }) => (
                <div key={q.id} className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-xs font-semibold text-muted-foreground">{q.id}</span>
                    <h4 className="text-sm font-semibold text-foreground">{q.question}</h4>
                  </div>
                  {(["option_a", "option_b", "option_c"] as const).map((opt) => (
                    <label key={opt} className="block">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Option {opt.slice(-1).toUpperCase()}
                      </span>
                      <textarea
                        value={q[opt]}
                        onChange={(e) => updateOption(idx, opt, e.target.value)}
                        rows={2}
                        className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                      />
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>

      <SaveBar saving={saving} msg={msg} onSave={onSave} onReset={onReset} />
    </div>
  );
}

function SaveBar({
  saving,
  msg,
  onSave,
  onReset,
}: {
  saving: boolean;
  msg: string | null;
  onSave: () => void;
  onReset: () => void;
}) {
  return (
    <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 p-4 backdrop-blur shadow-md">
      <span className="text-xs text-muted-foreground">{msg ?? "Edits are kept on this server only and are ephemeral on Cloud Run."}</span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onReset}
          disabled={saving}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted disabled:opacity-50"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition hover:bg-[var(--color-govdoc-deep)] disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
