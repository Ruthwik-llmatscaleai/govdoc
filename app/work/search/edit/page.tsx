"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Pencil, Trash2, Upload, Plus } from "lucide-react";
import { SaveBar } from "@/components/work/rubric/shared/save-bar";
import type { SaveDraft } from "@/components/work/rubric/shared/save-options-popover";
import { VersionHistoryPanel } from "@/components/work/rubric/version-history-panel";
import { CreateRubricDialog, type CreateRubricInput } from "@/components/work/rubric/shared/create-rubric-dialog";
import { ConfirmDialog, type ConfirmRequest } from "@/components/work/rubric/shared/confirm-dialog";
import { RubricUploadModal } from "@/components/work/rubric/rubric-upload-modal";
import type { RubricsManifestEntry } from "@/features/rubrics/store";

/* ─── Types ─── */
type CmgcQuestion = { id: string; section: string; question: string; option_a: string; option_b: string; option_c: string };
type CmgcData = { questions: CmgcQuestion[]; weights: Record<string, number> };
type CucpL2 = { name: string; description: string };
type CucpL3 = { s_no: number; name: string; title?: string; rule?: string; pass?: string; fail?: string };
type CucpData = { l2: CucpL2[]; l3: CucpL3[] };
type RowData = Record<string, Record<string, string>>;

type SectionGroup = { key: string; name: string; questions: CmgcQuestion[]; weight: number };

const USECASE_IDS = ["cmgc-pde", "row-appraisal", "cucp-reevals"] as const;
const USECASE_LABELS = ["Project", "Appraisal", "Narrative"] as const;

/* ─── Helpers ─── */
function groupCmgcSections(data: CmgcData): SectionGroup[] {
  const map = new Map<string, SectionGroup>();
  const maxWeight = Math.max(...Object.values(data.weights));
  const isDecimal = maxWeight <= 1;
  for (const q of data.questions) {
    const m = q.section.match(/^([A-Z]):\s*(.+)$/);
    const key = m?.[1] ?? "Z";
    const name = m?.[2] ?? q.section;
    const rawWeight = data.weights[key] ?? 0;
    const weight = isDecimal ? Math.round(rawWeight * 100) : rawWeight;
    const cur = map.get(key) ?? { key, name, questions: [], weight };
    cur.questions.push(q);
    map.set(key, cur);
  }
  for (const [k, w] of Object.entries(data.weights)) {
    if (!map.has(k)) {
      const weight = isDecimal ? Math.round(w * 100) : w;
      map.set(k, { key: k, name: k, questions: [], weight });
    }
  }
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
}

function serializeCmgcFromSections(sections: SectionGroup[]): CmgcData {
  const questions: CmgcQuestion[] = [];
  const weights: Record<string, number> = {};
  for (const s of sections) {
    weights[s.key] = s.weight / 100;
    for (const q of s.questions) {
      questions.push({ ...q, section: `${s.key}: ${s.name}` });
    }
  }
  return { questions, weights };
}

function serializeRow(data: Array<{ name: string; tiers: Record<string, string> }>): RowData {
  const out: RowData = {};
  for (const cat of data) out[cat.name] = cat.tiers;
  return out;
}

/* ─── Main Page ─── */
export default function ManageRubricsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null);

  // Rubric selection
  const [rubrics, setRubrics] = useState<RubricsManifestEntry[]>([]);
  const [selectedRubricId, setSelectedRubricId] = useState("default");

  // Save/version state
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [versionNonce, setVersionNonce] = useState(0);
  const [baselineVersionId, setBaselineVersionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Rubric data per use case
  const [cmgcSections, setCmgcSections] = useState<SectionGroup[]>([]);
  const [cucpData, setCucpData] = useState<CucpData>({ l2: [], l3: [] });
  const [rowCategories, setRowCategories] = useState<Array<{ name: string; tiers: Record<string, string> }>>([]);
  const [savedSnapshot, setSavedSnapshot] = useState("");

  const usecaseId = USECASE_IDS[activeTab]!;
  const rubricId = selectedRubricId;

  // Fetch rubric list
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/usecases/${usecaseId}/rubrics`);
        if (!res.ok || !alive) return;
        const body = (await res.json()) as { rubrics: RubricsManifestEntry[] };
        if (!alive) return;
        setRubrics(body.rubrics);
        const def = body.rubrics.find((r) => r.isDefault) ?? body.rubrics[0];
        if (def) setSelectedRubricId(def.id);
      } catch { /* silent */ }
    })();
    return () => { alive = false; };
  }, [usecaseId]);

  // Fetch rubric content
  useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        const url = `/api/usecases/${usecaseId}/rubric?rubric=${encodeURIComponent(selectedRubricId)}${baselineVersionId ? `&versionId=${baselineVersionId}` : ""}`;
        const res = await fetch(url);
        if (!res.ok || !alive) return;
        const data = await res.json();
        if (!alive) return;
        if (usecaseId === "cmgc-pde") {
          setCmgcSections(groupCmgcSections(data));
        } else if (usecaseId === "cucp-reevals") {
          setCucpData({ l2: data.l2 ?? [], l3: data.l3 ?? [] });
        } else {
          const cats = Object.entries(data).map(([name, tiers]) => ({ name, tiers: tiers as Record<string, string> }));
          setRowCategories(cats);
        }
        setSavedSnapshot(JSON.stringify(data));
        setDirty(false);
        setSaveMsg(null);
      } catch { /* silent */ }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [usecaseId, selectedRubricId, versionNonce, baselineVersionId]);

  // Tab counts — only the active tab shows a real count
  const activeCount = useMemo(() => {
    if (activeTab === 0) return cmgcSections.reduce((s, sec) => s + sec.questions.length, 0);
    if (activeTab === 1) return rowCategories.length;
    return cucpData.l3.length;
  }, [activeTab, cmgcSections, rowCategories, cucpData]);

  // Weight validation
  const weightSum = useMemo(() => {
    if (activeTab !== 0) return 100;
    return Math.round(cmgcSections.reduce((s, sec) => s + sec.weight, 0));
  }, [activeTab, cmgcSections]);

  // --- Handlers ---
  const markDirty = useCallback(() => setDirty(true), []);

  const handleSave = useCallback(async (draft: SaveDraft) => {
    setSaving(true);
    setSaveMsg(null);
    try {
      let payload: unknown;
      if (usecaseId === "cmgc-pde") payload = serializeCmgcFromSections(cmgcSections);
      else if (usecaseId === "cucp-reevals") payload = cucpData;
      else payload = serializeRow(rowCategories);

      const params = new URLSearchParams();
      params.set("rubric", rubricId);
      if (draft.mode === "overwrite") params.set("mode", "overwrite");
      else if (draft.useCustom) {
        if (!draft.customId) throw new Error("Custom version id is required");
        params.set("versionId", draft.customId);
      } else params.set("bump", draft.bump);
      if (draft.note) params.set("note", draft.note);

      const res = await fetch(`/api/usecases/${usecaseId}/rubric?${params.toString()}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const body = (await res.json()) as { versionId: string };
      setSaveMsg(draft.mode === "overwrite" ? `Overwrote ${body.versionId}.` : `Saved as ${body.versionId}.`);
      setBaselineVersionId(body.versionId);
      setSavedSnapshot(JSON.stringify(payload));
      setDirty(false);
      setVersionNonce((n) => n + 1);
      // Refresh rubric list dropdown
      try {
        const listRes = await fetch(`/api/usecases/${usecaseId}/rubrics`);
        if (listRes.ok) {
          const listBody = (await listRes.json()) as { rubrics: RubricsManifestEntry[] };
          setRubrics(listBody.rubrics);
        }
      } catch { /* silent */ }
    } catch (e) {
      setSaveMsg(`Save failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally { setSaving(false); }
  }, [usecaseId, rubricId, cmgcSections, cucpData, rowCategories]);

  const handleReset = useCallback(() => {
    if (!savedSnapshot) return;
    try {
      const data = JSON.parse(savedSnapshot);
      if (usecaseId === "cmgc-pde") setCmgcSections(groupCmgcSections(data));
      else if (usecaseId === "cucp-reevals") setCucpData({ l2: data.l2 ?? [], l3: data.l3 ?? [] });
      else {
        const cats = Object.entries(data).map(([name, tiers]) => ({ name, tiers: tiers as Record<string, string> }));
        setRowCategories(cats);
      }
      setDirty(false);
      setSaveMsg(null);
    } catch { /* silent */ }
  }, [savedSnapshot, usecaseId]);

  async function handleCreateRubric(input: CreateRubricInput) {
    const res = await fetch(`/api/usecases/${usecaseId}/rubrics`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? `HTTP ${res.status}`);
    }
    const body = (await res.json()) as { entry: RubricsManifestEntry };
    setRubrics((prev) => [...prev, body.entry]);
    setSelectedRubricId(body.entry.id);
    setShowCreateDialog(false);
    setVersionNonce((n) => n + 1);
  }

  async function handleSetDefault() {
    const res = await fetch(`/api/usecases/${usecaseId}/rubrics/${selectedRubricId}/default`, { method: "PATCH" });
    if (res.ok) {
      const body = (await res.json()) as { rubrics: RubricsManifestEntry[] };
      setRubrics(body.rubrics);
    }
  }

  function handleDeleteRubric() {
    const entry = rubrics.find((r) => r.id === selectedRubricId);
    setConfirmRequest({
      title: "Delete rubric",
      message: `Delete rubric "${entry?.label ?? selectedRubricId}"? This cannot be undone. You cannot delete the default rubric.`,
      confirmLabel: "Delete",
      danger: true,
      onConfirm: async () => {
        const res = await fetch(`/api/usecases/${usecaseId}/rubrics/${selectedRubricId}`, { method: "DELETE" });
        if (res.ok) {
          const body = (await res.json()) as { rubrics: RubricsManifestEntry[] };
          setRubrics(body.rubrics);
          const def = body.rubrics.find((r) => r.isDefault) ?? body.rubrics[0];
          if (def) setSelectedRubricId(def.id);
        }
        setConfirmRequest(null);
      },
    });
  }

  const isDefault = rubrics.find((r) => r.id === selectedRubricId)?.isDefault ?? true;

  // --- CMGC Section Mutations ---
  function updateSection(key: string, updates: Partial<{ name: string; weight: number; description: string }>) {
    setCmgcSections((prev) => prev.map((s) => s.key === key ? { ...s, ...updates } : s));
    markDirty();
  }
  function deleteSection(key: string) {
    setConfirmRequest({
      title: "Delete section",
      message: `Delete section "${cmgcSections.find((s) => s.key === key)?.name}" and all its questions?`,
      confirmLabel: "Delete",
      danger: true,
      onConfirm: () => {
        setCmgcSections((prev) => prev.filter((s) => s.key !== key));
        markDirty();
        setConfirmRequest(null);
      },
    });
  }
  function addSection(name: string, weight: number) {
    const usedKeys = new Set(cmgcSections.map((s) => s.key));
    let newKey = "";
    for (let i = 0; i < 26; i++) {
      const k = String.fromCharCode(65 + i);
      if (!usedKeys.has(k)) { newKey = k; break; }
    }
    if (!newKey) return;
    setCmgcSections((prev) => [...prev, { key: newKey, name, weight, questions: [] }]);
    markDirty();
  }
  function updateQuestion(sectionKey: string, questionId: string, updates: Partial<CmgcQuestion>) {
    setCmgcSections((prev) => prev.map((s) =>
      s.key === sectionKey
        ? { ...s, questions: s.questions.map((q) => q.id === questionId ? { ...q, ...updates } : q) }
        : s,
    ));
    markDirty();
  }
  function deleteQuestion(sectionKey: string, questionId: string) {
    const q = cmgcSections.find((s) => s.key === sectionKey)?.questions.find((q) => q.id === questionId);
    setConfirmRequest({
      title: "Delete question",
      message: `Delete question "${q?.question.slice(0, 60)}..."?`,
      confirmLabel: "Delete",
      danger: true,
      onConfirm: () => {
        setCmgcSections((prev) => prev.map((s) =>
          s.key === sectionKey ? { ...s, questions: s.questions.filter((q) => q.id !== questionId) } : s,
        ));
        markDirty();
        setConfirmRequest(null);
      },
    });
  }
  function addQuestion(sectionKey: string, question: string, optA: string, optB: string, optC: string) {
    const sec = cmgcSections.find((s) => s.key === sectionKey);
    if (!sec) return;
    const newQ: CmgcQuestion = {
      id: `${sectionKey}${sec.questions.length + 1}`,
      section: `${sectionKey}: ${sec.name}`,
      question,
      option_a: optA,
      option_b: optB,
      option_c: optC,
    };
    setCmgcSections((prev) => prev.map((s) =>
      s.key === sectionKey ? { ...s, questions: [...s.questions, newQ] } : s,
    ));
    markDirty();
  }

  // --- ROW Mutations ---
  function updateRowTier(catIdx: number, tier: string, value: string) {
    setRowCategories((prev) => prev.map((c, i) => i === catIdx ? { ...c, tiers: { ...c.tiers, [tier]: value } } : c));
    markDirty();
  }
  function addRowCategory(name: string) {
    setRowCategories((prev) => [...prev, { name, tiers: { "1": "", "2": "", "3": "", "4": "", "5": "" } }]);
    markDirty();
  }
  function deleteRowCategory(idx: number) {
    const cat = rowCategories[idx];
    setConfirmRequest({
      title: "Delete category",
      message: `Delete "${cat?.name}" and all its tier descriptions?`,
      confirmLabel: "Delete",
      danger: true,
      onConfirm: () => {
        setRowCategories((prev) => prev.filter((_, i) => i !== idx));
        markDirty();
        setConfirmRequest(null);
      },
    });
  }

  // --- CUCP Mutations ---
  function updateCriterion(sNo: number, updates: Partial<CucpL3>) {
    setCucpData((prev) => ({ ...prev, l3: prev.l3.map((c) => c.s_no === sNo ? { ...c, ...updates } : c) }));
    markDirty();
  }
  function addCriterion(name: string, pass: string, fail: string) {
    const nextSNo = cucpData.l3.length > 0 ? Math.max(...cucpData.l3.map((c) => c.s_no)) + 1 : 1;
    setCucpData((prev) => ({ ...prev, l3: [...prev.l3, { s_no: nextSNo, name, pass, fail }] }));
    markDirty();
  }
  function deleteCriterion(sNo: number) {
    const crit = cucpData.l3.find((c) => c.s_no === sNo);
    setConfirmRequest({
      title: "Delete criterion",
      message: `Delete "${crit?.title ?? crit?.name}"?`,
      confirmLabel: "Delete",
      danger: true,
      onConfirm: () => {
        setCucpData((prev) => ({ ...prev, l3: prev.l3.filter((c) => c.s_no !== sNo) }));
        markDirty();
        setConfirmRequest(null);
      },
    });
  }

  // --- Tab switch with dirty warning ---
  function switchTab(idx: number) {
    if (dirty) {
      setConfirmRequest({
        title: "Unsaved changes",
        message: "You have unsaved changes. Switch tabs and discard them?",
        confirmLabel: "Discard & Switch",
        danger: true,
        onConfirm: () => {
          setDirty(false);
          setActiveTab(idx);
          setBaselineVersionId(null);
          setConfirmRequest(null);
        },
      });
    } else {
      setActiveTab(idx);
      setBaselineVersionId(null);
    }
  }

  return (
    <div className="relative min-h-full">
      {/* Breadcrumbs */}
      <nav className="mb-7 flex items-center gap-2.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
        <Link href="/workspace" className="text-[var(--color-ink-mute)] transition-colors hover:text-[var(--color-ink)]">Workspace</Link>
        <span className="opacity-60">/</span>
        <Link href="/work/search" className="text-[var(--color-ink-mute)] transition-colors hover:text-[var(--color-ink)]">Rubrics</Link>
        <span className="opacity-60">/</span>
        <span className="font-medium text-[var(--color-ink)]">Manage Rubrics</span>
      </nav>

      <div className="govdoc-kicker mb-6">
        <span className="govdoc-kicker-number">03</span>
        <span>Rubrics · Manage</span>
      </div>

      <div className="mb-6 flex items-start justify-between">
        <div className="space-y-3">
          <h1 className="govdoc-display">Manage <em>Rubrics.</em></h1>
          <p className="govdoc-copy">
            Build and refine the scoring rubrics GovDoc applies to each review type. Add questions, set weights, adjust options &mdash; <strong className="font-semibold text-[var(--color-ink-soft)]">every change is versioned and audit-logged</strong>.
          </p>
        </div>
        <span className="govdoc-pill border-[#D6C2A0] text-[#8A6335] before:bg-[#C78B3A]">ADMIN&nbsp;&middot;&nbsp;EDIT MODE</span>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex items-center gap-1 border-b border-[var(--color-line)]">
        {USECASE_LABELS.map((label, i) => (
          <button key={label} onClick={() => switchTab(i)} className={`relative px-4 py-3 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors ${activeTab === i ? "text-[var(--color-ink)] after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:bg-[var(--color-govdoc-primary)]" : "text-[var(--color-ink-mute)] hover:text-[var(--color-ink-soft)]"}`}>
            {label}
            {activeTab === i && (
              <span className="ml-2 inline-flex size-5 items-center justify-center rounded-full bg-[var(--color-govdoc-primary)] text-[9px] font-bold text-white">{activeCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Action bar */}
      <div className="govdoc-surface mb-6 flex flex-wrap items-center gap-3 px-4 py-2.5">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--color-ink-soft)]">
          <span className="text-[var(--color-ink-faint)]">RUBRIC:</span>
          <select value={selectedRubricId} onChange={(e) => { setSelectedRubricId(e.target.value); setBaselineVersionId(null); setVersionNonce((n) => n + 1); }} className="rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] px-2 py-1 font-mono text-[11px] font-medium uppercase text-[var(--color-ink)]">
            {rubrics.map((r) => <option key={r.id} value={r.id}>{r.label}{r.isDefault ? " (default)" : ""}</option>)}
          </select>
        </div>
        <div className="mx-2 h-5 w-px bg-[var(--color-line)]" />
        <button type="button" onClick={() => setShowCreateDialog(true)} className="inline-flex items-center gap-1.5 rounded-md bg-[var(--color-govdoc-primary)] px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-white transition-colors hover:bg-[var(--color-govdoc-deep)]">
          <Plus className="size-3" /> Create Rubric
        </button>
        <button type="button" onClick={() => setShowUploadModal(true)} className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-line)] bg-[var(--color-cream-soft)] px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-cream)]">
          <Upload className="size-3" /> Upload
        </button>
        {!isDefault && (
          <button type="button" onClick={handleSetDefault} className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-line)] bg-[var(--color-cream-soft)] px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-cream)]">
            Set Default
          </button>
        )}
        <button type="button" onClick={handleDeleteRubric} disabled={isDefault} title={isDefault ? "Cannot delete the default rubric. Promote another first." : undefined} className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-red-700 transition-colors hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed">
          <Trash2 className="size-3" /> Delete Rubric
        </button>
      </div>

      {/* Weight warning */}
      {activeTab === 0 && weightSum !== 100 && cmgcSections.length > 0 && (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-800">
          Section weights sum to {weightSum}%, not 100%.
        </div>
      )}

      {/* Loading */}
      {loading && <p className="py-8 text-center text-sm text-[var(--color-ink-faint)]">Loading rubric…</p>}

      {/* Tab content */}
      {!loading && activeTab === 0 && (
        <ProjectTab sections={cmgcSections} onUpdateSection={updateSection} onDeleteSection={deleteSection} onUpdateQuestion={updateQuestion} onDeleteQuestion={deleteQuestion} onAddQuestion={addQuestion} onAddSection={addSection} />
      )}
      {!loading && activeTab === 1 && (
        <AppraisalTab categories={rowCategories} onUpdateTier={updateRowTier} onAddCategory={addRowCategory} onDeleteCategory={deleteRowCategory} />
      )}
      {!loading && activeTab === 2 && (
        <NarrativeTab data={cucpData} onUpdateCriterion={updateCriterion} onAddCriterion={addCriterion} onDeleteCriterion={deleteCriterion} />
      )}

      {/* Version History — keyed by rubric so it resets on rubric switch */}
      <div className="mt-10">
        <VersionHistoryPanel key={`${usecaseId}:${rubricId}`} usecaseId={usecaseId} rubricId={rubricId} refreshNonce={versionNonce} baselineVersionId={baselineVersionId} onChanged={() => setVersionNonce((n) => n + 1)} onLoad={(vid) => setBaselineVersionId(vid)} />
      </div>

      {/* Save bar */}
      <div className="mt-8">
        <SaveBar usecaseId={usecaseId} rubricId={rubricId} dirty={dirty} saving={saving} msg={saveMsg} baselineVersionId={baselineVersionId} downloadHref={`/api/usecases/${usecaseId}/rubric/download?rubric=${rubricId}`} downloadLabel="Export XLSX" onReset={handleReset} onSave={handleSave} />
      </div>

      {/* Dialogs */}
      {showCreateDialog && <CreateRubricDialog rubrics={rubrics} onSave={handleCreateRubric} onCancel={() => setShowCreateDialog(false)} />}
      {confirmRequest && <ConfirmDialog request={confirmRequest} onCancel={() => setConfirmRequest(null)} />}
      <RubricUploadModal open={showUploadModal} usecaseId={usecaseId} rubricId={selectedRubricId} onUploaded={({ rubricId: rid }) => { setShowUploadModal(false); setSelectedRubricId(rid); setVersionNonce((n) => n + 1); }} onClose={() => setShowUploadModal(false)} />
    </div>
  );
}

/* ─── New Section Form ─── */
function NewSectionForm({ onAdd, onCancel }: { onAdd: (name: string, weight: number) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  return (
    <div className="mb-6 rounded-[8px] border border-emerald-200 bg-emerald-50/50 px-5 py-4">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.1em] text-emerald-700"><Plus className="inline size-3 mr-1" />New Section</div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-faint)]">Title *</span>
          <input autoFocus type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Environmental Compliance" className="mt-1 w-full rounded-md border border-[var(--color-line)] bg-white px-2.5 py-1.5 text-sm" />
        </label>
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-faint)]">Weight (%)</span>
          <input type="number" min={0} max={100} value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0" className="mt-1 w-full rounded-md border border-[var(--color-line)] bg-white px-2.5 py-1.5 text-sm" />
        </label>
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => { if (name.trim()) onAdd(name.trim(), Number(weight) || 0); }} disabled={!name.trim()} className="rounded-md bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">Create Section</button>
        <button type="button" onClick={onCancel} className="rounded-md border border-[var(--color-line)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-mute)] hover:bg-[var(--color-cream)]">Cancel</button>
      </div>
    </div>
  );
}

/* ─── Project (CMGC) Tab ─── */
function ProjectTab({ sections, onUpdateSection, onDeleteSection, onUpdateQuestion, onDeleteQuestion, onAddQuestion, onAddSection }: {
  sections: SectionGroup[];
  onUpdateSection: (key: string, u: Partial<{ name: string; weight: number }>) => void;
  onDeleteSection: (key: string) => void;
  onUpdateQuestion: (secKey: string, qId: string, u: Partial<CmgcQuestion>) => void;
  onDeleteQuestion: (secKey: string, qId: string) => void;
  onAddQuestion: (secKey: string, q: string, a: string, b: string, c: string) => void;
  onAddSection: (name: string, weight: number) => void;
}) {
  const [expanded, setExpanded] = useState<string>(sections[0]?.key ?? "");
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [addingSection, setAddingSection] = useState(false);

  return (
    <div className="space-y-0">
      {sections.map((sec, idx) => {
        const isOpen = expanded === sec.key;
        return (
          <div key={sec.key} className={`border border-[var(--color-line)] ${idx === 0 ? "rounded-t-[8px]" : ""} ${idx === sections.length - 1 ? "rounded-b-[8px]" : ""} ${idx > 0 ? "-mt-px" : ""} ${isOpen ? "bg-[var(--color-paper)]" : "bg-[var(--color-cream-soft)]"}`}>
            {/* Header */}
            <div role="button" tabIndex={0} onClick={() => setExpanded(isOpen ? "" : sec.key)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setExpanded(isOpen ? "" : sec.key); }} className="flex w-full items-center gap-4 px-5 py-4 text-left cursor-pointer">
              <span className="font-mono text-[12px] font-bold text-[var(--color-ink-faint)]">{String(idx + 1).padStart(2, "0")}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold text-[var(--color-ink)]">{sec.name}</div>
              </div>
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-ink-faint)]">{sec.questions.length} Q&nbsp;&middot;&nbsp;{sec.weight}%</span>
              {isOpen && (
                <button type="button" aria-label={`Edit section ${sec.name}`} onClick={(e) => { e.stopPropagation(); setEditingSection(editingSection === sec.key ? null : sec.key); }} className="inline-flex items-center gap-1.5 rounded border border-[var(--color-line)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-ink-mute)] transition-colors hover:bg-[var(--color-cream)]">
                  <Pencil className="size-3" /> Edit
                </button>
              )}
              {isOpen && (
                <button type="button" aria-label={`Delete section ${sec.name}`} onClick={(e) => { e.stopPropagation(); onDeleteSection(sec.key); }} className="inline-flex items-center justify-center rounded border border-[var(--color-line)] p-1.5 text-[var(--color-ink-faint)] transition-colors hover:bg-red-50 hover:text-red-500">
                  <Trash2 className="size-3.5" />
                </button>
              )}
              <span className="text-[var(--color-ink-faint)]">{isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}</span>
            </div>

            {/* Section edit form */}
            {editingSection === sec.key && (
              <SectionEditForm section={sec} onSave={(u) => { onUpdateSection(sec.key, u); setEditingSection(null); }} onCancel={() => setEditingSection(null)} />
            )}

            {/* Questions */}
            {isOpen && editingSection !== sec.key && (
              <div className="border-t border-[var(--color-line-soft)] px-5 pb-5">
                <div className="divide-y divide-[var(--color-line-soft)]">
                  {sec.questions.map((q, qi) => (
                    <div key={q.id} className="group/question py-4">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 font-mono text-[11px] font-bold text-[var(--color-ink-faint)]">{String(qi + 1).padStart(2, "0")}</span>
                        <div className="min-w-0 flex-1">
                          {editingQuestion === q.id ? (
                            <QuestionEditForm question={q} onSave={(u) => { onUpdateQuestion(sec.key, q.id, u); setEditingQuestion(null); }} onCancel={() => setEditingQuestion(null)} />
                          ) : (
                            <>
                              <div className="text-[13px] font-medium leading-[1.5] text-[var(--color-ink-soft)]">{q.question}</div>
                              <div className="mt-2 space-y-1">
                                {[q.option_a, q.option_b, q.option_c].map((opt, oi) => (
                                  <div key={oi} className="flex items-start gap-2 text-[12px] leading-[1.5] text-[var(--color-ink-mute)]">
                                    <span className="mt-px font-mono font-bold text-[var(--color-ink-faint)]">{String.fromCharCode(65 + oi)}</span>
                                    <span>{opt}</span>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                        {editingQuestion !== q.id && (
                          <div className="flex shrink-0 items-center gap-1.5 opacity-0 transition-opacity group-hover/question:opacity-100">
                            <button type="button" aria-label={`Edit question ${q.id}`} onClick={() => setEditingQuestion(q.id)} className="inline-flex items-center gap-1 rounded border border-[var(--color-line)] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-[var(--color-ink-mute)] transition-colors hover:bg-[var(--color-cream)]">
                              <Pencil className="size-2.5" /> Edit
                            </button>
                            <button type="button" aria-label={`Delete question ${q.id}`} onClick={() => onDeleteQuestion(sec.key, q.id)} className="inline-flex items-center justify-center rounded border border-[var(--color-line)] p-1 text-[var(--color-ink-faint)] transition-colors hover:bg-red-50 hover:text-red-500">
                              <Trash2 className="size-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {addingTo === sec.key ? (
                  <AddQuestionForm onAdd={(q, a, b, c) => { onAddQuestion(sec.key, q, a, b, c); setAddingTo(null); }} onCancel={() => setAddingTo(null)} />
                ) : (
                  <button type="button" onClick={() => setAddingTo(sec.key)} className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-dashed border-[var(--color-line)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-ink-mute)] transition-colors hover:border-[var(--color-govdoc-primary)] hover:text-[var(--color-govdoc-primary)]">
                    <Plus className="size-3" /> Add question
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
      {sections.length === 0 && !addingSection && <p className="py-8 text-center text-sm text-[var(--color-ink-faint)] italic">No sections yet. Click "Add section" below.</p>}
      {addingSection ? (
        <NewSectionForm onAdd={(name, weight) => { onAddSection(name, weight); setAddingSection(false); }} onCancel={() => setAddingSection(false)} />
      ) : (
        <button type="button" onClick={() => setAddingSection(true)} className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-dashed border-[var(--color-line)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-ink-mute)] transition-colors hover:border-[var(--color-govdoc-primary)] hover:text-[var(--color-govdoc-primary)]">
          <Plus className="size-3" /> Add section
        </button>
      )}
    </div>
  );
}

function SectionEditForm({ section, onSave, onCancel }: { section: SectionGroup; onSave: (u: { name: string; weight: number }) => void; onCancel: () => void }) {
  const [name, setName] = useState(section.name);
  const [weight, setWeight] = useState(String(section.weight));
  return (
    <div className="border-t border-[var(--color-line-soft)] bg-amber-50/40 px-5 py-4">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.1em] text-amber-700"><Pencil className="inline size-3 mr-1" />Editing Section</div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block"><span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-faint)]">Title</span><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-md border border-[var(--color-line)] bg-white px-2.5 py-1.5 text-sm" /></label>
        <label className="block"><span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-faint)]">Weight (%)</span><input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="mt-1 w-full rounded-md border border-[var(--color-line)] bg-white px-2.5 py-1.5 text-sm" /></label>
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => onSave({ name: name.trim(), weight: Number(weight) || 0 })} className="rounded-md bg-[var(--color-govdoc-primary)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-govdoc-deep)]">Save</button>
        <button type="button" onClick={onCancel} className="rounded-md border border-[var(--color-line)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-mute)] hover:bg-[var(--color-cream)]">Cancel</button>
      </div>
    </div>
  );
}

function QuestionEditForm({ question, onSave, onCancel }: { question: CmgcQuestion; onSave: (u: Partial<CmgcQuestion>) => void; onCancel: () => void }) {
  const [text, setText] = useState(question.question);
  const [a, setA] = useState(question.option_a);
  const [b, setB] = useState(question.option_b);
  const [c, setC] = useState(question.option_c);
  return (
    <div className="space-y-2">
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} className="w-full rounded-md border border-[var(--color-line)] bg-white px-2.5 py-1.5 text-sm" />
      {[["A", a, setA], ["B", b, setB], ["C", c, setC]].map(([letter, val, setter]) => (
        <label key={letter as string} className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-bold text-[var(--color-ink-faint)]">{letter as string}</span>
          <input type="text" value={val as string} onChange={(e) => (setter as (v: string) => void)(e.target.value)} className="flex-1 rounded-md border border-[var(--color-line)] bg-white px-2 py-1 text-xs" />
        </label>
      ))}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={() => onSave({ question: text, option_a: a, option_b: b, option_c: c })} className="rounded-md bg-[var(--color-govdoc-primary)] px-3 py-1 text-xs font-semibold text-white hover:bg-[var(--color-govdoc-deep)]">Save</button>
        <button type="button" onClick={onCancel} className="rounded-md border border-[var(--color-line)] px-3 py-1 text-xs text-[var(--color-ink-mute)] hover:bg-[var(--color-cream)]">Cancel</button>
      </div>
    </div>
  );
}

function AddQuestionForm({ onAdd, onCancel }: { onAdd: (q: string, a: string, b: string, c: string) => void; onCancel: () => void }) {
  const [text, setText] = useState("");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [c, setC] = useState("");
  return (
    <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50/50 p-4">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.1em] text-emerald-700">New Question</div>
      <textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="Question text..." className="w-full rounded-md border border-[var(--color-line)] bg-white px-2.5 py-1.5 text-sm" />
      <div className="mt-2 space-y-1.5">
        {[["A", a, setA], ["B", b, setB], ["C", c, setC]].map(([letter, val, setter]) => (
          <label key={letter as string} className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold text-[var(--color-ink-faint)]">{letter as string}</span>
            <input type="text" value={val as string} onChange={(e) => (setter as (v: string) => void)(e.target.value)} placeholder={`Option ${letter}`} className="flex-1 rounded-md border border-[var(--color-line)] bg-white px-2 py-1 text-xs" />
          </label>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => { if (text.trim()) onAdd(text.trim(), a, b, c); }} disabled={!text.trim()} className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">Add Question</button>
        <button type="button" onClick={onCancel} className="rounded-md border border-[var(--color-line)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-mute)] hover:bg-[var(--color-cream)]">Cancel</button>
      </div>
    </div>
  );
}

function CategoryEditForm({ category, onSave, onCancel }: { category: { name: string; tiers: Record<string, string> }; onSave: (u: { name: string; tiers: Record<string, string> }) => void; onCancel: () => void }) {
  const [name, setName] = useState(category.name);
  const [t1, setT1] = useState(category.tiers["1"] ?? "");
  const [t2, setT2] = useState(category.tiers["2"] ?? "");
  const [t3, setT3] = useState(category.tiers["3"] ?? "");
  const [t4, setT4] = useState(category.tiers["4"] ?? "");
  const [t5, setT5] = useState(category.tiers["5"] ?? "");
  return (
    <div className="border-t border-[var(--color-line-soft)] bg-amber-50/40 px-5 py-4">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.1em] text-amber-700"><Pencil className="inline size-3 mr-1" />Editing Section</div>
      <label className="mb-3 block"><span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-faint)]">Category Name</span><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-md border border-[var(--color-line)] bg-white px-2.5 py-1.5 text-sm" /></label>
      <div className="space-y-2">
        {[
          ["1", "Tier 1 — Unacceptable", t1, setT1],
          ["2", "Tier 2 — Poor", t2, setT2],
          ["3", "Tier 3 — Acceptable", t3, setT3],
          ["4", "Tier 4 — Good", t4, setT4],
          ["5", "Tier 5 — Excellent", t5, setT5],
        ].map(([num, label, val, setter]) => (
          <label key={num as string} className="block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-faint)]">{label as string}</span>
            <textarea value={val as string} onChange={(e) => (setter as (v: string) => void)(e.target.value)} rows={2} className="mt-1 w-full rounded-md border border-[var(--color-line)] bg-white px-2.5 py-1.5 text-xs" />
          </label>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => onSave({ name: name.trim(), tiers: { "1": t1, "2": t2, "3": t3, "4": t4, "5": t5 } })} className="rounded-md bg-[var(--color-govdoc-primary)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-govdoc-deep)]">Save</button>
        <button type="button" onClick={onCancel} className="rounded-md border border-[var(--color-line)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-mute)] hover:bg-[var(--color-cream)]">Cancel</button>
      </div>
    </div>
  );
}

/* ─── Appraisal (ROW) Tab ─── */
function AppraisalTab({ categories, onUpdateTier, onAddCategory, onDeleteCategory }: { categories: Array<{ name: string; tiers: Record<string, string> }>; onUpdateTier: (idx: number, tier: string, value: string) => void; onAddCategory: (name: string) => void; onDeleteCategory: (idx: number) => void }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  return (
    <div>
      <div className="space-y-0">
        {categories.map((cat, idx) => {
          const isOpen = expanded === idx;
          return (
            <div key={cat.name} className={`border border-[var(--color-line)] ${idx === 0 ? "rounded-t-[8px]" : ""} ${idx === categories.length - 1 ? "rounded-b-[8px]" : ""} ${idx > 0 ? "-mt-px" : ""} ${isOpen ? "bg-[var(--color-paper)]" : "bg-[var(--color-cream-soft)]"}`}>
              <div role="button" tabIndex={0} onClick={() => setExpanded(isOpen ? null : idx)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setExpanded(isOpen ? null : idx); }} className="flex w-full items-center gap-4 px-5 py-4 text-left cursor-pointer">
                <span className="font-mono text-[12px] font-bold text-[var(--color-ink-faint)]">{String(idx + 1).padStart(2, "0")}</span>
                <div className="min-w-0 flex-1"><div className="text-[14px] font-semibold text-[var(--color-ink)]">{cat.name}</div></div>
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-ink-faint)]">{Object.values(cat.tiers).filter((v) => v).length} / 5 TIERS</span>
                {isOpen && (
                  <button type="button" aria-label={`Edit ${cat.name}`} onClick={(e) => { e.stopPropagation(); setEditingIdx(editingIdx === idx ? null : idx); }} className="inline-flex items-center gap-1.5 rounded border border-[var(--color-line)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-ink-mute)] transition-colors hover:bg-[var(--color-cream)]">
                    <Pencil className="size-3" /> Edit
                  </button>
                )}
                {isOpen && (
                  <button type="button" aria-label={`Delete ${cat.name}`} onClick={(e) => { e.stopPropagation(); onDeleteCategory(idx); }} className="inline-flex items-center justify-center rounded border border-[var(--color-line)] p-1.5 text-[var(--color-ink-faint)] transition-colors hover:bg-red-50 hover:text-red-500">
                    <Trash2 className="size-3.5" />
                  </button>
                )}
                <span className="text-[var(--color-ink-faint)]">{isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}</span>
              </div>

              {/* Inline edit form — same pattern as CMGC SectionEditForm */}
              {editingIdx === idx && (
                <CategoryEditForm
                  category={cat}
                  onSave={(updated) => {
                    for (const tier of ["1", "2", "3", "4", "5"]) {
                      if (updated.tiers[tier] !== cat.tiers[tier]) {
                        onUpdateTier(idx, tier, updated.tiers[tier] ?? "");
                      }
                    }
                    setEditingIdx(null);
                  }}
                  onCancel={() => setEditingIdx(null)}
                />
              )}

              {/* Read-only tier display */}
              {isOpen && editingIdx !== idx && (
                <div className="border-t border-[var(--color-line-soft)] px-5 pb-5">
                  {(["1", "2", "3", "4", "5"] as const).map((tier) => (
                    <div key={tier} className="flex items-start gap-3 py-3 border-b border-[var(--color-line-soft)] last:border-b-0">
                      <span className="mt-1 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-govdoc-primary)] font-mono text-[10px] font-bold text-white">{tier}</span>
                      <span className="flex-1 text-[13px] leading-[1.5] text-[var(--color-ink-soft)]">
                        {cat.tiers[tier] || <span className="italic text-[var(--color-ink-faint)]">Not defined</span>}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {adding ? (
        <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50/50 p-4">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.1em] text-emerald-700">New Category</div>
          <input autoFocus type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Category name..." className="w-full rounded-md border border-[var(--color-line)] bg-white px-2.5 py-1.5 text-sm" />
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => { if (newName.trim()) { onAddCategory(newName.trim()); setNewName(""); setAdding(false); } }} disabled={!newName.trim()} className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">Add Category</button>
            <button type="button" onClick={() => { setAdding(false); setNewName(""); }} className="rounded-md border border-[var(--color-line)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-mute)] hover:bg-[var(--color-cream)]">Cancel</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-dashed border-[var(--color-line)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-ink-mute)] transition-colors hover:border-[var(--color-govdoc-primary)] hover:text-[var(--color-govdoc-primary)]">
          <Plus className="size-3" /> Add category
        </button>
      )}
      {categories.length === 0 && !adding && <p className="py-8 text-center text-sm text-[var(--color-ink-faint)] italic">No categories loaded.</p>}
    </div>
  );
}

/* ─── Narrative (CUCP) Tab ─── */
function NarrativeTab({ data, onUpdateCriterion, onAddCriterion, onDeleteCriterion }: { data: CucpData; onUpdateCriterion: (sNo: number, u: Partial<CucpL3>) => void; onAddCriterion: (name: string, pass: string, fail: string) => void; onDeleteCriterion: (sNo: number) => void }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div>
      <div className="space-y-0">
        {data.l3.map((crit, idx) => {
          const isOpen = expanded === crit.s_no;
          const isEditing = editing === crit.s_no;
          return (
            <div key={crit.s_no} className={`border border-[var(--color-line)] ${idx === 0 ? "rounded-t-[8px]" : ""} ${idx === data.l3.length - 1 ? "rounded-b-[8px]" : ""} ${idx > 0 ? "-mt-px" : ""} ${isOpen ? "bg-[var(--color-paper)]" : "bg-[var(--color-cream-soft)]"}`}>
              <div role="button" tabIndex={0} onClick={() => setExpanded(isOpen ? null : crit.s_no)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setExpanded(isOpen ? null : crit.s_no); }} className="flex w-full items-center gap-4 px-5 py-4 text-left cursor-pointer">
                <span className="font-mono text-[12px] font-bold text-[var(--color-ink-faint)]">{String(crit.s_no).padStart(2, "0")}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold text-[var(--color-ink)]">{crit.title ?? crit.name}</div>
                  {crit.rule && <div className="mt-0.5 text-[12px] text-[var(--color-ink-mute)]">{crit.rule}</div>}
                </div>
                {isOpen && (
                  <button type="button" aria-label={`Edit ${crit.title ?? crit.name}`} onClick={(e) => { e.stopPropagation(); setEditing(isEditing ? null : crit.s_no); }} className="inline-flex items-center gap-1.5 rounded border border-[var(--color-line)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-ink-mute)] transition-colors hover:bg-[var(--color-cream)]">
                    <Pencil className="size-3" /> Edit
                  </button>
                )}
                {isOpen && (
                  <button type="button" aria-label={`Delete ${crit.title ?? crit.name}`} onClick={(e) => { e.stopPropagation(); onDeleteCriterion(crit.s_no); }} className="inline-flex items-center justify-center rounded border border-[var(--color-line)] p-1.5 text-[var(--color-ink-faint)] transition-colors hover:bg-red-50 hover:text-red-500">
                    <Trash2 className="size-3.5" />
                  </button>
                )}
                <span className="text-[var(--color-ink-faint)]">{isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}</span>
              </div>
              {isOpen && !isEditing && (
                <div className="border-t border-[var(--color-line-soft)] px-5 pb-5 pt-4 space-y-3">
                  {crit.pass && <div className="flex items-start gap-2"><span className="mt-0.5 inline-flex shrink-0 items-center rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-emerald-700">Pass</span><span className="text-[13px] leading-[1.5] text-[var(--color-ink-soft)]">{crit.pass}</span></div>}
                  {crit.fail && <div className="flex items-start gap-2"><span className="mt-0.5 inline-flex shrink-0 items-center rounded bg-red-100 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-red-700">Fail</span><span className="text-[13px] leading-[1.5] text-[var(--color-ink-soft)]">{crit.fail}</span></div>}
                </div>
              )}
              {isOpen && isEditing && (
                <CriterionEditForm criterion={crit} onSave={(u) => { onUpdateCriterion(crit.s_no, u); setEditing(null); }} onCancel={() => setEditing(null)} />
              )}
            </div>
          );
        })}
      </div>
      {adding ? (
        <AddCriterionForm onAdd={(name, pass, fail) => { onAddCriterion(name, pass, fail); setAdding(false); }} onCancel={() => setAdding(false)} />
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-dashed border-[var(--color-line)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-ink-mute)] transition-colors hover:border-[var(--color-govdoc-primary)] hover:text-[var(--color-govdoc-primary)]">
          <Plus className="size-3" /> Add criterion
        </button>
      )}
      {data.l3.length === 0 && !adding && <p className="py-8 text-center text-sm text-[var(--color-ink-faint)] italic">No criteria loaded.</p>}
    </div>
  );
}

function AddCriterionForm({ onAdd, onCancel }: { onAdd: (name: string, pass: string, fail: string) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [pass, setPass] = useState("");
  const [fail, setFail] = useState("");
  return (
    <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-emerald-700">New Criterion</div>
      <label className="block"><span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-faint)]">Name *</span><input autoFocus type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Criterion name..." className="mt-1 w-full rounded-md border border-[var(--color-line)] bg-white px-2.5 py-1.5 text-sm" /></label>
      <label className="block"><span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Pass criteria</span><textarea value={pass} onChange={(e) => setPass(e.target.value)} rows={2} placeholder="What constitutes a pass..." className="mt-1 w-full rounded-md border border-emerald-200 bg-white px-2.5 py-1.5 text-sm" /></label>
      <label className="block"><span className="text-[10px] font-bold uppercase tracking-wider text-red-700">Fail criteria</span><textarea value={fail} onChange={(e) => setFail(e.target.value)} rows={2} placeholder="What constitutes a fail..." className="mt-1 w-full rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-sm" /></label>
      <div className="flex gap-2">
        <button type="button" onClick={() => { if (name.trim()) onAdd(name.trim(), pass, fail); }} disabled={!name.trim()} className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">Add Criterion</button>
        <button type="button" onClick={onCancel} className="rounded-md border border-[var(--color-line)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-mute)] hover:bg-[var(--color-cream)]">Cancel</button>
      </div>
    </div>
  );
}

function CriterionEditForm({ criterion, onSave, onCancel }: { criterion: CucpL3; onSave: (u: Partial<CucpL3>) => void; onCancel: () => void }) {
  const [name, setName] = useState(criterion.name ?? "");
  const [title, setTitle] = useState(criterion.title ?? "");
  const [pass, setPass] = useState(criterion.pass ?? "");
  const [fail, setFail] = useState(criterion.fail ?? "");
  const [rule, setRule] = useState(criterion.rule ?? "");
  return (
    <div className="border-t border-[var(--color-line-soft)] bg-amber-50/40 px-5 py-4 space-y-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-amber-700"><Pencil className="inline size-3 mr-1" />Editing Criterion</div>
      <label className="block"><span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-faint)]">Criterion Name *</span><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-md border border-[var(--color-line)] bg-white px-2.5 py-1.5 text-sm" /></label>
      <label className="block"><span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-faint)]">Display Title</span><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Optional display title" className="mt-1 w-full rounded-md border border-[var(--color-line)] bg-white px-2.5 py-1.5 text-sm" /></label>
      <label className="block"><span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-faint)]">Rule / Note</span><input type="text" value={rule} onChange={(e) => setRule(e.target.value)} className="mt-1 w-full rounded-md border border-[var(--color-line)] bg-white px-2.5 py-1.5 text-sm" /></label>
      <label className="block"><span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Pass criteria</span><textarea value={pass} onChange={(e) => setPass(e.target.value)} rows={2} className="mt-1 w-full rounded-md border border-emerald-200 bg-white px-2.5 py-1.5 text-sm" /></label>
      <label className="block"><span className="text-[10px] font-bold uppercase tracking-wider text-red-700">Fail criteria</span><textarea value={fail} onChange={(e) => setFail(e.target.value)} rows={2} className="mt-1 w-full rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-sm" /></label>
      <div className="flex gap-2">
        <button type="button" onClick={() => onSave({ name: name.trim() || undefined, title: title.trim() || undefined, pass, fail, rule: rule || undefined })} className="rounded-md bg-[var(--color-govdoc-primary)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-govdoc-deep)]">Save</button>
        <button type="button" onClick={onCancel} className="rounded-md border border-[var(--color-line)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-mute)] hover:bg-[var(--color-cream)]">Cancel</button>
      </div>
    </div>
  );
}
