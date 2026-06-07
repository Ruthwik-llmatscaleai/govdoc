"use client";
import { useEffect, useRef, useState } from "react";
import { isValidVersionId, computeNextVersionId, type VersionBump } from "@/features/rubrics/version";

export type SaveMode = "new" | "overwrite";

export type SaveDraft = {
  mode: SaveMode;
  bump: VersionBump;
  customId: string;
  useCustom: boolean;
  note: string;
};

export const DEFAULT_SAVE_DRAFT: SaveDraft = {
  mode: "new",
  bump: "minor",
  customId: "",
  useCustom: false,
  note: "",
};

export function previewSaveLabel(
  draft: SaveDraft,
  versions: ReadonlyArray<{ id: string }>,
  baselineVersionId: string | null,
): string {
  if (draft.mode === "overwrite") {
    return baselineVersionId ? `Overwrite ${baselineVersionId}` : "Overwrite";
  }
  if (draft.useCustom) {
    return draft.customId ? `Save as ${draft.customId}` : "Save";
  }
  try {
    const next = computeNextVersionId(versions, draft.bump);
    return `Save as ${next}`;
  } catch {
    return "Save";
  }
}

function safeCompute(versions: ReadonlyArray<{ id: string }>, bump: VersionBump): string {
  try {
    return computeNextVersionId(versions, bump);
  } catch {
    return "—";
  }
}

export function SaveOptionsPopover({
  draft,
  versions,
  baselineVersionId,
  onChange,
  onCancel,
  onConfirm,
}: {
  draft: SaveDraft;
  versions: ReadonlyArray<{ id: string }>;
  baselineVersionId: string | null;
  onChange: (next: SaveDraft) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [noteOpen, setNoteOpen] = useState(draft.note.length > 0);

  const headExists = versions.length > 0;
  const nextMinor = headExists ? safeCompute(versions, "minor") : "v1";
  const nextMajor = headExists ? safeCompute(versions, "major") : "v1";
  const baselineLabel = baselineVersionId ?? (headExists ? versions[0]!.id : "v1");

  const customIsValid =
    !draft.useCustom ||
    (isValidVersionId(draft.customId) &&
      !/^v0\d{2,}$/.test(draft.customId) &&
      !versions.some((v) => v.id === draft.customId));
  const customError =
    draft.useCustom && draft.customId.length > 0 && !customIsValid
      ? versions.some((v) => v.id === draft.customId)
        ? `${draft.customId} already exists`
        : "Use shape v1 or v1.2"
      : null;

  const overwriteDisabled = !headExists;
  const saveDisabled =
    draft.mode === "new" && draft.useCustom && (!draft.customId || !customIsValid);

  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) onCancel();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [onCancel]);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Save options"
      className="absolute right-0 bottom-full z-20 mb-2 w-[320px] rounded-lg border border-border bg-card p-4 text-sm shadow-lg"
    >
      <h4 className="mb-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Save as
      </h4>

      <label className="flex items-start gap-2.5 py-1">
        <input
          type="radio"
          name="save-mode"
          checked={draft.mode === "new"}
          onChange={() => onChange({ ...draft, mode: "new" })}
          className="mt-1"
        />
        <span className="font-medium text-foreground">New version</span>
      </label>

      {draft.mode === "new" && (
        <div className="ml-7 mt-1 mb-2 space-y-1.5 border-l border-border/60 pl-3">
          <label className="flex items-center gap-2 py-0.5 text-xs">
            <input
              type="radio"
              name="save-bump"
              checked={!draft.useCustom && draft.bump === "minor"}
              onChange={() => onChange({ ...draft, useCustom: false, bump: "minor" })}
            />
            <span className="font-medium text-foreground">Minor</span>
            <span className="font-mono text-muted-foreground">{nextMinor}</span>
          </label>
          <label className="flex items-center gap-2 py-0.5 text-xs">
            <input
              type="radio"
              name="save-bump"
              checked={!draft.useCustom && draft.bump === "major"}
              onChange={() => onChange({ ...draft, useCustom: false, bump: "major" })}
            />
            <span className="font-medium text-foreground">Major</span>
            <span className="font-mono text-muted-foreground">{nextMajor}</span>
          </label>
          <div className="flex items-center gap-2 py-0.5 text-xs">
            <input
              type="radio"
              id="save-custom-radio"
              name="save-bump"
              checked={draft.useCustom}
              onChange={() => onChange({ ...draft, useCustom: true })}
            />
            <label htmlFor="save-custom-radio" className="font-medium text-foreground">
              Custom
            </label>
            <input
              type="text"
              placeholder="v1.5"
              value={draft.customId}
              onChange={(e) => onChange({ ...draft, useCustom: true, customId: e.target.value })}
              className="flex-1 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-xs"
              aria-invalid={!!customError}
            />
          </div>
          {customError && <p className="text-[11px] text-destructive">{customError}</p>}
        </div>
      )}

      <label className={`flex items-start gap-2.5 py-1 ${overwriteDisabled ? "opacity-50" : ""}`}>
        <input
          type="radio"
          name="save-mode"
          checked={draft.mode === "overwrite"}
          disabled={overwriteDisabled}
          onChange={() => onChange({ ...draft, mode: "overwrite" })}
          className="mt-1"
        />
        <span className="font-medium text-foreground">
          Overwrite current <span className="font-mono text-muted-foreground">{baselineLabel}</span>
        </span>
      </label>
      {overwriteDisabled && (
        <p className="ml-7 text-[11px] text-muted-foreground">First save creates v1.</p>
      )}

      <div className="mt-3 border-t border-border pt-3">
        {!noteOpen ? (
          <button
            type="button"
            onClick={() => setNoteOpen(true)}
            className="text-xs font-medium text-primary hover:underline"
          >
            + Add note
          </button>
        ) : (
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium text-muted-foreground">
              Note (optional)
            </span>
            <input
              type="text"
              maxLength={200}
              value={draft.note}
              onChange={(e) => onChange({ ...draft, note: e.target.value })}
              className="w-full rounded border border-border bg-white px-2 py-1 text-xs"
            />
          </label>
        )}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={saveDisabled}
          className="rounded bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground transition hover:bg-[var(--color-govdoc-deep)] disabled:opacity-50"
        >
          {previewSaveLabel(draft, versions, baselineVersionId)}
        </button>
      </div>
    </div>
  );
}
