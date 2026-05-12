"use client";
import { useState } from "react";
import type { CmgcRubricData } from "@/lib/usecases/cmgc-pde/rubric-data";
import { defaultCmgcRubric } from "@/lib/usecases/cmgc-pde/rubric-data";
import type { RubricQuestion } from "@/lib/usecases/cmgc-pde/rubric";
import { EditableSection } from "./shared/editable-section";
import { RubricEditorCard, type EditorField } from "./shared/rubric-editor-card";

type SectionWeightKey = keyof CmgcRubricData["weights"];

type EditorTarget =
  | { kind: "addSection" }
  | { kind: "editSection"; sectionKey: SectionWeightKey }
  | { kind: "addQuestion"; sectionLabel: string }
  | { kind: "editQuestion"; questionId: string };

function nextSectionKey(existing: SectionWeightKey[]): SectionWeightKey | null {
  const all = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P"];
  for (const k of all) {
    if (!existing.includes(k as SectionWeightKey)) return k as SectionWeightKey;
  }
  return null;
}

function sectionLabel(key: string, name: string) {
  return `${key}: ${name}`;
}

function questionRow(q: RubricQuestion) {
  return (
    <div className="grid grid-cols-[auto_1fr] items-baseline gap-3.5">
      <span className="font-mono text-[10.5px] tracking-[0.08em] text-[var(--color-ink-faint)]">{q.id}</span>
      <span className="text-[13.5px] font-medium text-[var(--color-ink-soft)]">{q.question}</span>
    </div>
  );
}

export function CmgcRubricEdit({ initial }: { initial: CmgcRubricData }) {
  const [questions, setQuestions] = useState<RubricQuestion[]>(() =>
    initial.questions.map((q) => ({ ...q })),
  );
  const [weights, setWeights] = useState<CmgcRubricData["weights"]>(() => ({ ...initial.weights }));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorTarget | null>(null);

  const sectionKeys = (Object.keys(weights) as SectionWeightKey[]).sort();
  const sectionsMap = new Map<string, { key: SectionWeightKey; name: string; qs: RubricQuestion[] }>();
  for (const k of sectionKeys) sectionsMap.set(k, { key: k, name: k, qs: [] });
  for (const q of questions) {
    const m = q.section.match(/^([A-Z]):\s*(.+)$/);
    const key = (m?.[1] ?? "Z") as SectionWeightKey;
    const name = m?.[2] ?? q.section;
    const cur = sectionsMap.get(key) ?? { key, name, qs: [] };
    cur.name = name;
    cur.qs.push(q);
    sectionsMap.set(key, cur);
  }
  const sections = Array.from(sectionsMap.values());

  function applyEditor(values: Record<string, string>) {
    if (!editor) return;
    if (editor.kind === "addSection") {
      const newKey = nextSectionKey(sectionKeys);
      if (!newKey) return;
      setWeights((prev) => ({ ...prev, [newKey]: 0 }));
    }
    if (editor.kind === "editSection") {
      const { sectionKey } = editor;
      const newName = values.name?.trim() ?? "";
      const newWeight = Number(values.weight ?? "0");
      const oldLabel = sectionLabel(sectionKey, sectionsMap.get(sectionKey)?.name ?? sectionKey);
      const newLabel = sectionLabel(sectionKey, newName);
      setQuestions((prev) =>
        prev.map((q) => (q.section === oldLabel ? { ...q, section: newLabel } : q)),
      );
      if (!Number.isNaN(newWeight)) {
        setWeights((prev) => ({ ...prev, [sectionKey]: newWeight }));
      }
    }
    if (editor.kind === "addQuestion") {
      const id = `Q${Date.now()}`;
      setQuestions((prev) => [
        ...prev,
        {
          id,
          section: editor.sectionLabel,
          question: values.question ?? "",
          option_a: values.option_a ?? "",
          option_b: values.option_b ?? "",
          option_c: values.option_c ?? "",
        },
      ]);
    }
    if (editor.kind === "editQuestion") {
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === editor.questionId
            ? {
                ...q,
                question: values.question ?? q.question,
                option_a: values.option_a ?? q.option_a,
                option_b: values.option_b ?? q.option_b,
                option_c: values.option_c ?? q.option_c,
              }
            : q,
        ),
      );
    }
    setEditor(null);
  }

  function deleteSection(key: SectionWeightKey) {
    if (!confirm(`Delete section ${key} and all its questions?`)) return;
    setQuestions((prev) => prev.filter((q) => !q.section.startsWith(`${key}:`)));
    setWeights((prev) => {
      const next = { ...prev };
      delete (next as Record<string, number>)[key];
      return next;
    });
  }

  function deleteQuestion(id: string) {
    if (!confirm("Delete this question?")) return;
    setQuestions((prev) => prev.filter((q) => q.id !== id));
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
    if (!confirm("Reset Project Review rubric to defaults? This deletes any saved edits.")) return;
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

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const weightOk = Math.abs(totalWeight - 1) < 0.005;

  const editorTitle = (() => {
    if (!editor) return "";
    if (editor.kind === "addSection") return "New section";
    if (editor.kind === "editSection") return `Edit section ${editor.sectionKey}`;
    if (editor.kind === "addQuestion") return `New question in ${editor.sectionLabel}`;
    if (editor.kind === "editQuestion") return "Edit question";
    return "";
  })();

  const editorFields: EditorField[] = (() => {
    if (!editor) return [];
    if (editor.kind === "addSection") return [];
    if (editor.kind === "editSection") {
      return [
        { name: "name", label: "Section name", type: "text", required: true },
        { name: "weight", label: "Weight (0–1)", type: "text", required: true },
      ];
    }
    return [
      { name: "question", label: "Question", type: "textarea", required: true },
      { name: "option_a", label: "Option A", type: "textarea", required: true },
      { name: "option_b", label: "Option B", type: "textarea", required: true },
      { name: "option_c", label: "Option C", type: "textarea", required: true },
    ];
  })();

  const editorInitial: Record<string, string> = ((): Record<string, string> => {
    if (!editor) return {};
    if (editor.kind === "editSection") {
      const sec = sectionsMap.get(editor.sectionKey);
      return { name: sec?.name ?? "", weight: String(weights[editor.sectionKey] ?? 0) };
    }
    if (editor.kind === "editQuestion") {
      const q = questions.find((x) => x.id === editor.questionId);
      return {
        question: q?.question ?? "",
        option_a: q?.option_a ?? "",
        option_b: q?.option_b ?? "",
        option_c: q?.option_c ?? "",
      };
    }
    return { question: "", option_a: "", option_b: "", option_c: "" };
  })();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-4 text-xs">
        <span className="font-semibold uppercase tracking-wider text-muted-foreground">Section weights sum:</span>{" "}
        <span className={weightOk ? "text-foreground" : "text-destructive"}>
          {totalWeight.toFixed(2)} {weightOk ? "(ok)" : "(must equal 1.00)"}
        </span>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setEditor({ kind: "addSection" })}
          className="rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-foreground transition hover:bg-muted"
        >
          + Add section
        </button>
      </div>

      <div className="flex flex-col border border-[var(--color-line)] bg-[var(--color-paper)]">
        {sections.map((s, i) => (
          <EditableSection
            key={s.key}
            sectionKey={s.key}
            title={s.name}
            items={s.qs.map((q) => ({ id: q.id, text: q.question, raw: q }))}
            countLabel="question"
            defaultOpen={i === 0}
            renderRow={(it) => questionRow(it.raw)}
            onAdd={() => setEditor({ kind: "addQuestion", sectionLabel: sectionLabel(s.key, s.name) })}
            onEditItem={(id) => setEditor({ kind: "editQuestion", questionId: id })}
            onDeleteItem={(id) => deleteQuestion(id)}
            sectionActions={
              <>
                <button
                  type="button"
                  onClick={() => setEditor({ kind: "editSection", sectionKey: s.key })}
                  className="rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-foreground transition hover:bg-muted"
                >
                  Edit section
                </button>
                <button
                  type="button"
                  onClick={() => deleteSection(s.key)}
                  className="rounded-md border border-destructive/40 px-2.5 py-1 text-[11px] font-medium text-destructive transition hover:bg-destructive/5"
                >
                  Delete section
                </button>
              </>
            }
          />
        ))}
      </div>

      {editor && (
        <RubricEditorCard
          mode={editor.kind.startsWith("edit") ? "edit" : "create"}
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
        downloadHref="/api/usecases/cmgc-pde/rubric/download"
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
