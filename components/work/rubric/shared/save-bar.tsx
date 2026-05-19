"use client";
import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";
import {
  SaveOptionsPopover,
  DEFAULT_SAVE_DRAFT,
  previewSaveLabel,
  type SaveDraft,
} from "./save-options-popover";

type VersionEntry = { id: string };

export type SaveBarProps = {
  usecaseId: string;
  rubricId: string;
  dirty: boolean;
  saving: boolean;
  msg: string | null;
  /** The version the editor's data is sourced from (null when no versions yet). */
  baselineVersionId: string | null;
  /** True when the editor's content was pulled from history (loaded, not current head). */
  loadedFromHistory?: boolean;
  downloadHref: string;
  downloadLabel: string;
  onReset: () => void;
  onSave: (draft: SaveDraft) => void | Promise<void>;
};

export function SaveBar({
  usecaseId,
  rubricId,
  dirty,
  saving,
  msg,
  baselineVersionId,
  loadedFromHistory = false,
  downloadHref,
  downloadLabel,
  onReset,
  onSave,
}: SaveBarProps) {
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<SaveDraft>(DEFAULT_SAVE_DRAFT);

  // Refetch versions on mount, rubric change, AND after a save (msg flips
  // when the editor announces a new "Saved as vX" status).
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/usecases/${usecaseId}/rubrics/${rubricId}/versions`);
        if (!alive || !res.ok) return;
        const body = (await res.json()) as { versions: VersionEntry[] };
        if (alive) setVersions(body.versions);
      } catch {
        // Silent — the bar still saves; labels just don't preview a next id.
      }
    })();
    return () => {
      alive = false;
    };
  }, [usecaseId, rubricId, msg]);

  const status =
    msg ??
    (() => {
      const base = baselineVersionId
        ? loadedFromHistory
          ? `Editing ${baselineVersionId} (loaded from history)`
          : `Editing ${baselineVersionId}`
        : "Editing latest";
      return dirty ? `${base} · You have unsaved changes.` : `${base} · No unsaved changes.`;
    })();

  const splitLabel = dirty ? previewSaveLabel(draft, versions, baselineVersionId) : "Saved ✓";

  async function triggerSave() {
    setOpen(false);
    await onSave(draft);
    setDraft(DEFAULT_SAVE_DRAFT);
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
      <span
        className={`text-xs ${dirty && !msg ? "font-medium text-foreground" : "text-muted-foreground"}`}
      >
        {status}
      </span>

      <div className="flex items-center gap-2">
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

        <div className="relative inline-flex">
          <button
            type="button"
            onClick={triggerSave}
            disabled={saving || !dirty}
            className="rounded-l-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition hover:bg-[var(--color-govdoc-deep)] disabled:opacity-50"
          >
            {saving ? "Saving…" : splitLabel}
          </button>
          <button
            type="button"
            aria-label="Save options"
            onClick={() => setOpen((v) => !v)}
            disabled={saving || !dirty}
            className="rounded-r-lg border-l border-primary-foreground/20 bg-primary px-2 py-1.5 text-primary-foreground transition hover:bg-[var(--color-govdoc-deep)] disabled:opacity-50"
          >
            <ChevronUp className={`size-4 transition-transform ${open ? "" : "rotate-180"}`} />
          </button>

          {open && (
            <SaveOptionsPopover
              draft={draft}
              versions={versions}
              baselineVersionId={baselineVersionId}
              onChange={setDraft}
              onCancel={() => setOpen(false)}
              onConfirm={triggerSave}
            />
          )}
        </div>
      </div>
    </div>
  );
}
