"use client";
import { useState } from "react";
import type { RowRubricData } from "@/features/usecases/row-appraisal/rubric-data";
import { defaultRowRubric } from "@/features/usecases/row-appraisal/rubric-data";
import { RubricShell } from "./shared/rubric-shell";
import { RubricSection } from "./shared/rubric-section";
import { RubricEditorCard, type EditorField } from "./shared/rubric-editor-card";
import { ConfirmDialog, type ConfirmRequest } from "./shared/confirm-dialog";
import { SaveBar } from "./shared/save-bar";
import type { SaveDraft } from "./shared/save-options-popover";

const TIERS: ("1" | "2" | "3" | "4" | "5")[] = ["1", "2", "3", "4", "5"];

type ComposeTarget =
  | { kind: "addCategory" }
  | { kind: "renameCategory"; name: string };

export function RowRubricEdit({
  initial,
  usecaseId,
  rubricId,
  baselineVersionId = null,
  loadedFromHistory = false,
  onSaved,
}: {
  initial: RowRubricData;
  usecaseId: string;
  rubricId: string;
  baselineVersionId?: string | null;
  loadedFromHistory?: boolean;
  onSaved?: () => void | Promise<void>;
}) {
  const rubricUrlBase = `/api/usecases/${usecaseId}/rubric`;
  const rubricQuery = `?rubric=${encodeURIComponent(rubricId)}`;
  const [schema, setSchema] = useState<RowRubricData>(() =>
    Object.fromEntries(
      Object.entries(initial).map(([k, v]) => [k, { ...v }]),
    ) as RowRubricData,
  );
  const [target, setTarget] = useState<ComposeTarget | null>(null);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function updateTier(category: string, tier: (typeof TIERS)[number], value: string) {
    setSchema((prev) => ({
      ...prev,
      [category]: { ...prev[category]!, [tier]: value },
    }));
    setDirty(true);
  }

  function applyEditor(values: Record<string, string>) {
    if (!target) return;
    if (target.kind === "addCategory") {
      const name = (values.name ?? "").trim();
      if (!name || schema[name]) return;
      setSchema((prev) => ({
        ...prev,
        [name]: {
          "1": values.tier_1 ?? "",
          "2": values.tier_2 ?? "",
          "3": values.tier_3 ?? "",
          "4": values.tier_4 ?? "",
          "5": values.tier_5 ?? "",
        },
      }));
      setDirty(true);
      setTarget(null);
      return;
    }
    if (target.kind === "renameCategory") {
      const next = (values.name ?? "").trim();
      if (!next || next === target.name || schema[next]) {
        setTarget(null);
        return;
      }
      setSchema((prev) => {
        const out: RowRubricData = {} as RowRubricData;
        for (const [k, v] of Object.entries(prev)) {
          out[k === target.name ? next : k] = v;
        }
        return out;
      });
      setDirty(true);
      setTarget(null);
    }
  }

  function deleteCategory(name: string) {
    setConfirm({
      title: "Delete category",
      message: `Delete category "${name}" and all five tier descriptions? This cannot be undone.`,
      confirmLabel: "Delete category",
      danger: true,
      onConfirm: () => {
        setSchema((prev) => {
          const next: RowRubricData = {} as RowRubricData;
          for (const [k, v] of Object.entries(prev)) if (k !== name) next[k] = v;
          return next;
        });
        setDirty(true);
        if (target?.kind === "renameCategory" && target.name === name) {
          setTarget(null);
        }
        setConfirm(null);
      },
    });
  }

  async function onSave(draft: SaveDraft) {
    setSaving(true);
    setMsg(null);
    try {
      const params = new URLSearchParams();
      params.set("rubric", rubricId);
      if (draft.mode === "overwrite") {
        params.set("mode", "overwrite");
      } else if (draft.useCustom) {
        if (!draft.customId) throw new Error("Custom version id is required");
        params.set("versionId", draft.customId);
      } else {
        params.set("bump", draft.bump);
      }
      const res = await fetch(`${rubricUrlBase}?${params.toString()}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(schema),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const body = (await res.json()) as { versionId: string };
      setMsg(draft.mode === "overwrite" ? `Overwrote ${body.versionId}.` : `Saved as ${body.versionId}.`);
      setDirty(false);
      await onSaved?.();
    } catch (e) {
      setMsg(`Save failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  function onReset() {
    setConfirm({
      title: "Reset rubric",
      message: "Reset Validate Appraisal rubric to defaults? This deletes any saved edits.",
      confirmLabel: "Reset to defaults",
      danger: true,
      onConfirm: async () => {
        setConfirm(null);
        setSaving(true);
        setMsg(null);
        try {
          const res = await fetch(`${rubricUrlBase}${rubricQuery}`, { method: "DELETE" });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const def = defaultRowRubric();
          setSchema(
            Object.fromEntries(Object.entries(def).map(([k, v]) => [k, { ...v }])) as RowRubricData,
          );
          setMsg("Reset to defaults.");
          setDirty(false);
          setTarget(null);
        } catch (e) {
          setMsg(`Reset failed: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
          setSaving(false);
        }
      },
    });
  }

  const categories = Object.entries(schema);

  const compose = target ? buildCompose(target) : null;

  return (
    <div className="space-y-6 pb-2">
      <RubricShell
        description="Validate Appraisal — 34 categories, each rated on a 1–5 scale against the descriptors below. Per-category scores combine into the overall evaluation."
      >
        {categories.length === 0 ? (
          <div className="border border-dashed border-[var(--color-line)] bg-[var(--color-cream-soft)] px-6 py-12 text-center">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
              Empty rubric
            </p>
            <p className="mt-2 text-[13px] text-[var(--color-ink-mute)]">
              No categories yet. Click “Create category” to add the first one.
            </p>
          </div>
        ) : (
          categories.map(([category, tiers]) => {
            return (
              <RubricSection
                key={category}
                title={category}
                count={TIERS.length}
                countLabel="tier"
              >
                <div className="mb-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setTarget({ kind: "renameCategory", name: category })}
                    className={chip()}
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteCategory(category)}
                    className={chipDanger()}
                  >
                    Delete
                  </button>
                </div>
                <dl className="flex flex-col gap-2.5">
                  {TIERS.map((tier) => (
                    <div key={tier} className="grid grid-cols-[28px_1fr] items-baseline gap-3">
                      <span className="font-mono text-[10.5px] font-semibold tracking-[0.08em] text-[var(--color-ink-faint)]">
                        {tier}.
                      </span>
                      <textarea
                        aria-label={`Tier ${tier} for ${category}`}
                        value={tiers[tier]}
                        onChange={(e) => updateTier(category, tier, e.target.value)}
                        rows={2}
                        className="w-full rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] px-2.5 py-1.5 text-[12.5px] leading-[1.5] text-[var(--color-ink-soft)] focus:border-[var(--color-govdoc-primary)] focus:outline-none"
                        placeholder="—"
                      />
                    </div>
                  ))}
                </dl>
              </RubricSection>
            );
          })
        )}
      </RubricShell>

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => setTarget({ kind: "addCategory" })}
          className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-[var(--color-govdoc-deep)]"
        >
          Create category
        </button>
      </div>

      <SaveBar
        usecaseId={usecaseId}
        rubricId={rubricId}
        saving={saving}
        msg={msg}
        dirty={dirty}
        baselineVersionId={baselineVersionId}
        loadedFromHistory={loadedFromHistory}
        onSave={onSave}
        onReset={onReset}
        downloadHref={`${rubricUrlBase}/download${rubricQuery}`}
        downloadLabel="Download .xlsx"
      />

      {target && compose && (
        <RubricEditorCard
          mode={compose.mode}
          title={compose.title}
          fields={compose.fields}
          initialValues={compose.initial}
          saveLabel={compose.saveLabel}
          onSave={applyEditor}
          onCancel={() => setTarget(null)}
        />
      )}

      {confirm && <ConfirmDialog request={confirm} onCancel={() => setConfirm(null)} />}
    </div>
  );
}

function chip() {
  return "rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-foreground transition hover:bg-muted";
}

function chipDanger() {
  return "rounded-md border border-destructive/30 px-2.5 py-1 text-[11px] font-medium text-destructive/80 transition hover:bg-destructive/5 hover:text-destructive";
}

function buildCompose(target: ComposeTarget): {
  mode: "create" | "edit";
  title: string;
  saveLabel: string;
  fields: EditorField[];
  initial: Record<string, string>;
} {
  if (target.kind === "addCategory") {
    return {
      mode: "create",
      title: "Category",
      saveLabel: "Add category",
      fields: [
        { name: "name", label: "Category name", type: "text", required: true },
        { name: "tier_1", label: "Tier 1 — Unacceptable", type: "textarea" },
        { name: "tier_2", label: "Tier 2 — Poor", type: "textarea" },
        { name: "tier_3", label: "Tier 3 — Acceptable", type: "textarea" },
        { name: "tier_4", label: "Tier 4 — Good", type: "textarea" },
        { name: "tier_5", label: "Tier 5 — Excellent", type: "textarea" },
      ],
      initial: { name: "", tier_1: "", tier_2: "", tier_3: "", tier_4: "", tier_5: "" },
    };
  }
  return {
    mode: "edit",
    title: `Rename “${target.name}”`,
    saveLabel: "Rename",
    fields: [{ name: "name", label: "New category name", type: "text", required: true }],
    initial: { name: target.name },
  };
}
