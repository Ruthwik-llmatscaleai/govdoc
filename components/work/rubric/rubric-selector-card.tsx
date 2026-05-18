"use client";

import { useEffect, useState } from "react";
import { WorkCard } from "@/components/work/page-shell";

type RubricEntry = {
  id: string;
  label: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt?: string;
};

type VersionEntry = {
  id: string;
  createdAt: string;
  source: "edit" | "upload" | "clone" | "restore" | "seed";
  label?: string;
  note?: string;
};

export type RubricSelection = { rubricId: string; versionId: string | null };

export function RubricSelectorCard({
  usecaseId,
  onChange,
}: {
  usecaseId: string;
  onChange: (sel: RubricSelection) => void;
}) {
  const [rubrics, setRubrics] = useState<RubricEntry[]>([]);
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [rubricId, setRubricId] = useState<string>("");
  const [versionId, setVersionId] = useState<string>("");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/usecases/${usecaseId}/rubrics`);
        if (!res.ok) throw new Error(`Failed to load rubrics (${res.status})`);
        const body = (await res.json()) as { rubrics: RubricEntry[] };
        if (!alive) return;
        setRubrics(body.rubrics);
        const def = body.rubrics.find((r) => r.isDefault) ?? body.rubrics[0];
        if (def) setRubricId(def.id);
      } catch (e) {
        if (alive) setLoadError(e instanceof Error ? e.message : "Failed to load rubrics");
      }
    })();
    return () => {
      alive = false;
    };
  }, [usecaseId]);

  useEffect(() => {
    if (!rubricId) return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/usecases/${usecaseId}/rubrics/${rubricId}/versions`);
        if (!res.ok) throw new Error(`Failed to load versions (${res.status})`);
        const body = (await res.json()) as { versions: VersionEntry[] };
        if (!alive) return;
        setVersions(body.versions);
        setVersionId("");
      } catch (e) {
        if (alive) setLoadError(e instanceof Error ? e.message : "Failed to load versions");
      }
    })();
    return () => {
      alive = false;
    };
  }, [usecaseId, rubricId]);

  useEffect(() => {
    if (!rubricId) return;
    const effectiveVersionId = versionId || versions[0]?.id || null;
    onChange({ rubricId, versionId: effectiveVersionId });
  }, [rubricId, versionId, versions, onChange]);

  const latestId = versions[0]?.id;
  const selectedVersion = versions.find((v) => v.id === (versionId || latestId));

  return (
    <WorkCard title="Rubric" description="Choose the rubric and version to evaluate against.">
      {loadError && (
        <div role="alert" className="mb-3 border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {loadError}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-foreground/85">
          Rubric
          <select
            aria-label="Rubric"
            value={rubricId}
            onChange={(e) => setRubricId(e.target.value)}
            className="mt-1 block w-full border border-[var(--color-line)] bg-[var(--color-paper)] px-2 py-1.5 text-sm"
          >
            {rubrics.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
                {r.isDefault ? " (Default)" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-foreground/85">
          Version
          <select
            aria-label="Version"
            value={versionId}
            onChange={(e) => setVersionId(e.target.value)}
            className="mt-1 block w-full border border-[var(--color-line)] bg-[var(--color-paper)] px-2 py-1.5 text-sm"
          >
            <option value="">Latest{latestId ? ` (${latestId})` : ""}</option>
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.id} — {new Date(v.createdAt).toLocaleDateString()}
                {v.note ? ` — ${v.note.slice(0, 40)}` : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedVersion && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          {selectedVersion.id} · {new Date(selectedVersion.createdAt).toLocaleString()}
          {selectedVersion.note ? ` · ${selectedVersion.note}` : ""}
        </p>
      )}
    </WorkCard>
  );
}
