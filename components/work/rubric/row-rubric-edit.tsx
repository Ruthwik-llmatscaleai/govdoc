"use client";
import { useState } from "react";
import type { RowRubricData } from "@/lib/usecases/row-appraisal/rubric-data";
import { defaultRowRubric } from "@/lib/usecases/row-appraisal/rubric-data";
import { STATUS_TONE, statusFromScore } from "@/components/work/row/status-tone";
import { EditableSection } from "./shared/editable-section";
import { RubricEditorCard, type EditorField } from "./shared/rubric-editor-card";

const TIERS: ("1" | "2" | "3" | "4" | "5")[] = ["1", "2", "3", "4", "5"];

type EditorTarget =
  | { kind: "addCategory" }
  | { kind: "renameCategory"; name: string };

export function RowRubricEdit({ initial }: { initial: RowRubricData }) {
  const [schema, setSchema] = useState<RowRubricData>(() =>
    Object.fromEntries(Object.entries(initial).map(([k, v]) => [k, { ...v }])) as RowRubricData,
  );
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorTarget | null>(null);

  function updateTier(category: string, tier: (typeof TIERS)[number], value: string) {
    setSchema((prev) => ({ ...prev, [category]: { ...prev[category]!, [tier]: value } }));
  }

  function applyEditor(values: Record<string, string>) {
    if (!editor) return;
    if (editor.kind === "addCategory") {
      const name = (values.name ?? "").trim();
      if (!name || schema[name]) return;
      setSchema((prev) => ({ ...prev, [name]: { "1": "", "2": "", "3": "", "4": "", "5": "" } }));
    }
    if (editor.kind === "renameCategory") {
      const next = (values.name ?? "").trim();
      if (!next || next === editor.name || schema[next]) {
        setEditor(null);
        return;
      }
      setSchema((prev) => {
        const out: RowRubricData = {} as RowRubricData;
        for (const [k, v] of Object.entries(prev)) {
          out[k === editor.name ? next : k] = v;
        }
        return out;
      });
    }
    setEditor(null);
  }

  function deleteCategory(name: string) {
    if (!confirm(`Delete category "${name}"?`)) return;
    setSchema((prev) => {
      const next: RowRubricData = {} as RowRubricData;
      for (const [k, v] of Object.entries(prev)) if (k !== name) next[k] = v;
      return next;
    });
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
    if (!confirm("Reset Appraisal Review rubric to defaults? This deletes any saved edits.")) return;
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

  const editorFields: EditorField[] = [{ name: "name", label: "Category name", type: "text", required: true }];
  const editorTitle = editor?.kind === "addCategory" ? "New category" : `Rename category "${editor?.kind === "renameCategory" ? editor.name : ""}"`;
  const editorInitial = editor?.kind === "renameCategory" ? { name: editor.name } : { name: "" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {Object.keys(schema).length} categories. The 1–5 scale is fixed; tier descriptions are editable inline.
        </p>
        <button
          type="button"
          onClick={() => setEditor({ kind: "addCategory" })}
          className="rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-foreground transition hover:bg-muted"
        >
          + Add category
        </button>
      </div>

      <div className="flex flex-col border border-[var(--color-line)] bg-[var(--color-paper)]">
        {Object.entries(schema).map(([category, tiers]) => (
          <EditableSection
            key={category}
            title={category}
            items={TIERS.map((t) => ({ id: t, text: `Tier ${t}` }))}
            countLabel="tier"
            renderRow={() => null}
            onAdd={() => {}}
            onEditItem={() => {}}
            onDeleteItem={() => {}}
            sectionActions={
              <>
                <button
                  type="button"
                  onClick={() => setEditor({ kind: "renameCategory", name: category })}
                  className="rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-foreground transition hover:bg-muted"
                >
                  Rename
                </button>
                <button
                  type="button"
                  onClick={() => deleteCategory(category)}
                  className="rounded-md border border-destructive/40 px-2.5 py-1 text-[11px] font-medium text-destructive transition hover:bg-destructive/5"
                >
                  Delete
                </button>
              </>
            }
          >
            {/* Tier rows: edit-only inline. */}
            <div className="space-y-3 pt-3">
              {TIERS.map((tier) => {
                const tone = STATUS_TONE[statusFromScore(Number(tier))];
                return (
                  <div key={tier} className="flex items-start gap-3">
                    <span className={`flex size-9 shrink-0 items-center justify-center rounded-md font-mono font-semibold ${tone.cell}`}>
                      {tier}
                    </span>
                    <textarea
                      aria-label={`Tier ${tier} for ${category}`}
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
          </EditableSection>
        ))}
      </div>

      {editor && (
        <RubricEditorCard
          mode={editor.kind === "addCategory" ? "create" : "edit"}
          title={editorTitle}
          fields={editorFields}
          initialValues={editorInitial}
          onSave={applyEditor}
          onCancel={() => setEditor(null)}
        />
      )}

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
        <a href={downloadHref} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted">
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
