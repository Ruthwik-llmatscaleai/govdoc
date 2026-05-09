"use client";
import { useState } from "react";
import type { CucpRubricData } from "@/lib/usecases/cucp-reevals/rubric-merged";
import { defaultCucpRubric } from "@/lib/usecases/cucp-reevals/rubric-merged";
import type { CucpL2Category, CucpL3Criterion } from "@/lib/usecases/cucp-reevals/rubric";

export function CucpRubricEdit({ initial }: { initial: CucpRubricData }) {
  const [l2, setL2] = useState<CucpL2Category[]>(() => initial.l2.map((c) => ({ ...c })));
  const [l3, setL3] = useState<CucpL3Criterion[]>(() => initial.l3.map((c) => ({ ...c })));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function updateL2(idx: number, field: "name" | "description", value: string) {
    setL2((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
  }
  function updateL3(idx: number, field: "name" | "rule", value: string) {
    setL3((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, [field]: value === "" && field === "rule" ? undefined : value } : c)),
    );
  }

  async function onSave() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/usecases/cucp-reevals/rubric", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ l2, l3 }),
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
    if (!confirm("Reset CUCP rubric to defaults? This deletes any saved edits.")) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/usecases/cucp-reevals/rubric", { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const def = defaultCucpRubric();
      setL2(def.l2.map((c) => ({ ...c })));
      setL3(def.l3.map((c) => ({ ...c })));
      setMsg("Reset to defaults.");
    } catch (e) {
      setMsg(`Reset failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">Level 2 — Legal Categories</h3>
        {l2.map((c, idx) => (
          <div key={idx} className="space-y-1.5">
            <input
              type="text"
              value={c.name}
              onChange={(e) => updateL2(idx, "name", e.target.value)}
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm font-semibold"
            />
            <textarea
              value={c.description}
              onChange={(e) => updateL2(idx, "description", e.target.value)}
              rows={2}
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-muted-foreground"
            />
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">Level 3 — 7 Criteria</h3>
        {l3.map((c, idx) => (
          <div key={c.s_no} className="space-y-2 border-t border-border pt-3 first:border-t-0 first:pt-0">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-xs font-semibold text-muted-foreground">{c.s_no}.</span>
              <input
                type="text"
                value={c.name}
                onChange={(e) => updateL3(idx, "name", e.target.value)}
                className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm font-medium"
              />
            </div>
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rule (optional)</span>
              <textarea
                value={c.rule ?? ""}
                onChange={(e) => updateL3(idx, "rule", e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                placeholder="—"
              />
            </label>
          </div>
        ))}
      </section>

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
