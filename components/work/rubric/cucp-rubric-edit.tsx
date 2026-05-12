"use client";
import { useState } from "react";
import type { CucpRubricData } from "@/lib/usecases/cucp-reevals/rubric-data";
import { defaultCucpRubric } from "@/lib/usecases/cucp-reevals/rubric-data";
import type { CucpL2Category, CucpL3Criterion } from "@/lib/usecases/cucp-reevals/rubric";
import { EditableSection } from "./shared/editable-section";
import { RubricEditorCard, type EditorField } from "./shared/rubric-editor-card";

type EditorTarget =
  | { kind: "addL2" }
  | { kind: "editL2"; name: string }
  | { kind: "addL3" }
  | { kind: "editL3"; sNo: number };

export function CucpRubricEdit({ initial }: { initial: CucpRubricData }) {
  const [l2, setL2] = useState<CucpL2Category[]>(() => initial.l2.map((c) => ({ ...c })));
  const [l3, setL3] = useState<CucpL3Criterion[]>(() => initial.l3.map((c) => ({ ...c })));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorTarget | null>(null);

  function applyEditor(values: Record<string, string>) {
    if (!editor) return;
    if (editor.kind === "addL2") {
      setL2((prev) => [...prev, { name: values.name ?? "", description: values.description ?? "" }]);
    }
    if (editor.kind === "editL2") {
      setL2((prev) =>
        prev.map((c) =>
          c.name === editor.name
            ? { name: values.name ?? c.name, description: values.description ?? c.description }
            : c,
        ),
      );
    }
    if (editor.kind === "addL3") {
      const nextNo = (l3.reduce((max, c) => Math.max(max, c.s_no), 0) || 0) + 1;
      setL3((prev) => [
        ...prev,
        {
          s_no: nextNo,
          name: values.name ?? "",
          rule: values.rule || undefined,
          pass: values.pass || undefined,
          fail: values.fail || undefined,
          title: values.title || undefined,
        },
      ]);
    }
    if (editor.kind === "editL3") {
      setL3((prev) =>
        prev.map((c) =>
          c.s_no === editor.sNo
            ? {
                ...c,
                name: values.name ?? c.name,
                rule: values.rule || undefined,
                pass: values.pass || undefined,
                fail: values.fail || undefined,
                title: values.title || undefined,
              }
            : c,
        ),
      );
    }
    setEditor(null);
  }

  function deleteL2(name: string) {
    if (!confirm(`Delete legal category "${name}"?`)) return;
    setL2((prev) => prev.filter((c) => c.name !== name));
  }
  function deleteL3(sNo: number) {
    if (!confirm(`Delete criterion #${sNo}?`)) return;
    setL3((prev) => prev.filter((c) => c.s_no !== sNo).map((c, i) => ({ ...c, s_no: i + 1 })));
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
    if (!confirm("Reset Narrative Review rubric to defaults? This deletes any saved edits.")) return;
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

  const editorTitle = (() => {
    if (!editor) return "";
    if (editor.kind === "addL2") return "New legal category";
    if (editor.kind === "editL2") return `Edit legal category "${editor.name}"`;
    if (editor.kind === "addL3") return "New criterion";
    if (editor.kind === "editL3") return `Edit criterion #${editor.sNo}`;
    return "";
  })();

  const editorFields: EditorField[] = (() => {
    if (!editor) return [];
    if (editor.kind === "addL2" || editor.kind === "editL2") {
      return [
        { name: "name", label: "Category name", type: "text", required: true },
        { name: "description", label: "Description", type: "textarea", required: true },
      ];
    }
    return [
      { name: "name", label: "Criterion name", type: "text", required: true },
      { name: "title", label: "Display title (optional)", type: "text" },
      { name: "rule", label: "Rule (optional)", type: "textarea" },
      { name: "pass", label: "YES definition (optional)", type: "textarea" },
      { name: "fail", label: "NO definition (optional)", type: "textarea" },
    ];
  })();

  const editorInitial: Record<string, string> = ((): Record<string, string> => {
    if (!editor) return {};
    if (editor.kind === "editL2") {
      const c = l2.find((x) => x.name === editor.name);
      return { name: c?.name ?? "", description: c?.description ?? "" };
    }
    if (editor.kind === "editL3") {
      const c = l3.find((x) => x.s_no === editor.sNo);
      return {
        name: c?.name ?? "",
        title: c?.title ?? "",
        rule: c?.rule ?? "",
        pass: c?.pass ?? "",
        fail: c?.fail ?? "",
      };
    }
    if (editor.kind === "addL2") return { name: "", description: "" };
    return { name: "", title: "", rule: "", pass: "", fail: "" };
  })();

  return (
    <div className="space-y-6">
      <div className="flex flex-col border border-[var(--color-line)] bg-[var(--color-paper)]">
        <EditableSection
          title="Level 2 — Legal Categories"
          items={l2.map((c) => ({ id: c.name, text: c.name, raw: c }))}
          countLabel="category"
          defaultOpen
          renderRow={(it) => (
            <div>
              <div className="text-[13.5px] font-semibold text-[var(--color-ink)]">{it.raw.name}</div>
              <div className="text-[12.5px] leading-[1.5] text-[var(--color-ink-mute)]">{it.raw.description}</div>
            </div>
          )}
          onAdd={() => setEditor({ kind: "addL2" })}
          onEditItem={(id) => setEditor({ kind: "editL2", name: id })}
          onDeleteItem={(id) => deleteL2(id)}
        />
        <EditableSection
          title="Level 3 — 7 Criteria"
          items={l3.map((c) => ({ id: String(c.s_no), text: c.title ?? c.name, raw: c }))}
          countLabel="criterion"
          renderRow={(it) => (
            <div>
              <div className="text-[13.5px] font-semibold text-[var(--color-ink)]">
                <span className="mr-2 font-mono text-[11px] text-[var(--color-ink-faint)]">{it.raw.s_no}.</span>
                {it.raw.title ?? it.raw.name}
              </div>
              {it.raw.rule && (
                <div className="mt-1 text-[12px] italic text-[var(--color-ink-mute)]">{it.raw.rule}</div>
              )}
            </div>
          )}
          onAdd={() => setEditor({ kind: "addL3" })}
          onEditItem={(id) => setEditor({ kind: "editL3", sNo: Number(id) })}
          onDeleteItem={(id) => deleteL3(Number(id))}
        />
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
        downloadHref="/api/usecases/cucp-reevals/rubric/download"
        downloadLabel="Download .pdf"
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
