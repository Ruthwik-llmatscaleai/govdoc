"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RubricsManifestEntry } from "@/features/rubrics/store";

type VersionEntry = {
  id: string;
  createdAt: string;
  source: string;
  note?: string;
};

type Props = {
  rubrics: readonly RubricsManifestEntry[];
  selectedId: string;
  usecaseId: string;
  /** The version currently loaded in the editor. Null = latest (default). */
  currentVersionId?: string | null;
  /** Bumped after saves/restores so the picker refetches versions. */
  versionsNonce?: number;
  onSelect: (id: string) => void;
  onVersionSelect?: (versionId: string | null) => void;
  mode: "read-only" | "manage";
  onCreateClick?: () => void;
  onUploadClick?: () => void;
  onSetDefault?: (id: string) => void;
  onDelete?: (id: string) => void;
  busy?: boolean;
};

export function RubricPicker({
  rubrics,
  selectedId,
  usecaseId,
  currentVersionId = null,
  versionsNonce = 0,
  onSelect,
  onVersionSelect,
  mode,
  onCreateClick,
  onUploadClick,
  onSetDefault,
  onDelete,
  busy = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [versions, setVersions] = useState<VersionEntry[]>([]);

  const fetchVersions = useCallback(async () => {
    try {
      const res = await fetch(`/api/usecases/${usecaseId}/rubrics/${selectedId}/versions`);
      if (!res.ok) return;
      const body = (await res.json()) as { versions: VersionEntry[] };
      setVersions(body.versions);
    } catch {
      // silent
    }
  }, [usecaseId, selectedId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions, versionsNonce]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selected = rubrics.find((r) => r.id === selectedId) ?? rubrics[0];
  if (!selected) return null;

  const isDefault = selected.isDefault;
  const newestVersionId = versions[0]?.id ?? null;
  const displayVersion = currentVersionId ?? newestVersionId;

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
        Rubric
      </span>

      <select
        aria-label="Select Rubric"
        value={selectedId}
        onChange={(e) => onSelect(e.target.value)}
        disabled={busy}
        className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground hover:bg-muted focus:outline-none disabled:opacity-50"
      >
        {rubrics.map((r) => {
          const showDefaultTag = r.isDefault && r.label.toLowerCase() !== "default";
          return (
            <option key={r.id} value={r.id}>
              {r.label}
              {showDefaultTag ? " (Default)" : ""}
            </option>
          );
        })}
      </select>

      {/* Version dropdown */}
      <div ref={ref} className="relative inline-block">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground transition hover:bg-muted disabled:opacity-50"
        >
          <span className="font-mono font-semibold">
            {displayVersion ?? "Latest"}
          </span>
          <svg
            aria-hidden="true"
            width="10"
            height="10"
            viewBox="0 0 12 12"
            fill="none"
            className={`transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {open && (
          <div
            role="listbox"
            aria-label="Version"
            className="absolute left-0 top-full z-20 mt-1 min-w-[220px] max-h-[240px] overflow-y-auto overflow-x-hidden rounded-lg border border-border bg-card shadow-lg"
          >
            {versions.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                No versions yet. Save to create the first.
              </div>
            ) : (
              versions.map((v, i) => {
                const isNewest = i === 0;
                const isActive = currentVersionId === v.id || (!currentVersionId && isNewest);
                return (
                  <button
                    key={v.id}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => {
                      setOpen(false);
                      if (!isActive) {
                        onVersionSelect?.(isNewest ? null : v.id);
                      }
                    }}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition hover:bg-muted ${
                      isActive ? "bg-muted/60 font-medium" : ""
                    }`}
                  >
                    <span className="font-mono font-semibold text-foreground">{v.id}</span>
                    {isNewest && (
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">
                        latest
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {mode === "manage" && onCreateClick && (
        <button
          type="button"
          onClick={onCreateClick}
          disabled={busy}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
        >
          + New rubric
        </button>
      )}

      {mode === "manage" && onUploadClick && (
        <button
          type="button"
          onClick={onUploadClick}
          disabled={busy}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
        >
          Upload…
        </button>
      )}

      {mode === "manage" && !isDefault && onSetDefault && (
        <button
          type="button"
          onClick={() => onSetDefault(selected.id)}
          disabled={busy}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
        >
          Set as default
        </button>
      )}

      {mode === "manage" && onDelete && (
        <button
          type="button"
          onClick={() => !isDefault && onDelete(selected.id)}
          disabled={busy || isDefault}
          title={isDefault ? "Cannot delete the default rubric. Promote another rubric first." : undefined}
          className="rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive transition hover:bg-destructive/5 disabled:opacity-50"
        >
          Delete rubric
        </button>
      )}
    </div>
  );
}
