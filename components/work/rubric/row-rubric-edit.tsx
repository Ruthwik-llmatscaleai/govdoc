"use client";
import { useState } from "react";
import type { RowRubricData } from "@/lib/usecases/row-appraisal/rubric-data";
import { defaultRowRubric } from "@/lib/usecases/row-appraisal/rubric-data";
import { STATUS_TONE, statusFromScore } from "@/components/work/row/status-tone";

const TIERS: ("1" | "2" | "3" | "4" | "5")[] = ["1", "2", "3", "4", "5"];

export function RowRubricEdit({ initial }: { initial: RowRubricData }) {
  const [schema, setSchema] = useState<RowRubricData>(() =>
    Object.fromEntries(Object.entries(initial).map(([k, v]) => [k, { ...v }])) as RowRubricData,
  );
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function updateTier(category: string, tier: (typeof TIERS)[number], value: string) {
    setSchema((prev) => ({ ...prev, [category]: { ...prev[category]!, [tier]: value } }));
  }

  async function onSave() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/usecases/row-appraisal/rubric", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(schema),
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
    if (!confirm("Reset ROW rubric to defaults? This deletes any saved edits.")) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/usecases/row-appraisal/rubric", { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const def = defaultRowRubric();
      setSchema(Object.fromEntries(Object.entries(def).map(([k, v]) => [k, { ...v }])) as RowRubricData);
      setMsg("Reset to defaults.");
    } catch (e) {
      setMsg(`Reset failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">
        {Object.keys(schema).length} categories. Leave a tier blank to indicate it&rsquo;s not used for that category.
      </p>
      <div className="space-y-2">
        {Object.entries(schema).map(([category, tiers]) => (
          <details key={category} className="rounded-2xl border border-border bg-card">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-semibold text-foreground">
              <span className="break-words">{category}</span>
              <span className="text-xs font-normal text-muted-foreground">▾</span>
            </summary>
            <div className="border-t border-border p-4 space-y-3">
              {TIERS.map((tier) => {
                const tone = STATUS_TONE[statusFromScore(Number(tier))];
                return (
                  <div key={tier} className="flex items-start gap-3">
                    <span className={`flex size-9 shrink-0 items-center justify-center rounded-md font-mono font-semibold ${tone.cell}`}>
                      {tier}
                    </span>
                    <textarea
                      value={tiers[tier]}
                      onChange={(e) => updateTier(category, tier, e.target.value)}
                      rows={2}
                      className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                      placeholder="—"
                    />
                  </div>
                );
              })}
            </div>
          </details>
        ))}
      </div>
      <SaveBar
        saving={saving}
        msg={msg}
        onSave={onSave}
        onReset={onReset}
        downloadHref="/api/usecases/row-appraisal/rubric/download"
        downloadLabel="Download .xlsx"
      />
    </div>
  );
}

function SaveBar({
  saving,
  msg,
  onSave,
  onReset,
  downloadHref,
  downloadLabel,
}: {
  saving: boolean;
  msg: string | null;
  onSave: () => void;
  onReset: () => void;
  downloadHref: string;
  downloadLabel: string;
}) {
  return (
    <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 p-4 backdrop-blur shadow-md">
      <span className="text-xs text-muted-foreground">{msg ?? "Edits are kept on this server only and are ephemeral on Cloud Run."}</span>
      <div className="flex gap-2">
        <a
          href={downloadHref}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
        >
          {downloadLabel}
        </a>
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
