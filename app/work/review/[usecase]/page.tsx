"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { usePipelineStore } from "@/store/use-pipeline";
import { getUseCase } from "@/lib/usecases/registry";
import { InputsForm } from "@/components/work/cmgc/inputs-form";
import { ScoreTable } from "@/components/work/cmgc/score-table";
import { RecommendationCard } from "@/components/work/cmgc/recommendation-card";
import { MethodRanking } from "@/components/work/cmgc/method-ranking";
import { ValidationCard } from "@/components/work/cmgc/validation-card";
import type { CmgcRunResult } from "@/lib/usecases/cmgc-pde/types";

type RouteParams = { usecase: string };

export default function UseCasePage({ params }: { params: Promise<RouteParams> }) {
  const { usecase } = use(params);
  const router = useRouter();
  const current = usePipelineStore((s) => s.current);
  const reset = usePipelineStore((s) => s.reset);

  const uc = getUseCase(usecase);
  if (!uc) {
    return (
      <div className="p-6">
        <p>Unknown use case.</p>
        <button type="button" onClick={() => router.push("/work/review")}>Back to picker</button>
      </div>
    );
  }

  if (usecase !== "cmgc-pde") {
    return <div className="p-6">Use case <code>{usecase}</code> not yet implemented in Phase 1.</div>;
  }

  // No run started OR previous run reset
  if (!current || (current.status === "idle" && Object.keys(current.stages).length === 0)) {
    return (
      <div className="p-6 space-y-4 max-w-2xl">
        <h1 className="text-2xl font-bold">{uc.label}</h1>
        <p className="text-muted-foreground">{uc.blurb}</p>
        <InputsForm />
      </div>
    );
  }

  // Running — show progress UI
  if (current.status === "running" || current.status === "needs-input") {
    return (
      <div className="p-6 space-y-4 max-w-2xl">
        <h1 className="text-2xl font-bold">{uc.label}</h1>
        <p>Running pipeline…</p>
        <div className="space-y-2">
          {Object.values(current.stages).map((stage) => (
            <div key={stage.id} className="flex items-center justify-between border rounded p-2">
              <span className="font-medium">{stage.label || stage.id}</span>
              <span className="text-sm">
                {stage.status} {stage.pct > 0 && `(${stage.pct}%)`}
                {stage.message && ` — ${stage.message}`}
              </span>
            </div>
          ))}
        </div>
        <button type="button" onClick={reset}>Cancel</button>
      </div>
    );
  }

  if (current.status === "error") {
    return (
      <div className="p-6 space-y-4 max-w-2xl">
        <h1 className="text-2xl font-bold">{uc.label}</h1>
        <div className="border border-red-300 bg-red-50 p-3 rounded">
          {Object.values(current.stages).find((s) => s.status === "error")?.error ?? "Unknown error"}
        </div>
        <button type="button" onClick={reset}>Start over</button>
      </div>
    );
  }

  // Done — render result UI + exporter buttons
  if (current.status === "done" && current.result) {
    const result = composeResult(current.result);
    if (!result) {
      return <div className="p-6">Result missing expected stages.</div>;
    }
    return (
      <div className="p-6 space-y-6 max-w-6xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{uc.label}</h1>
          <div className="flex gap-2">
            {uc.exporters.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => downloadExport(usecase, e.id, e.label, result)}
              >
                {e.label}
              </button>
            ))}
            <button type="button" onClick={reset}>Run again</button>
          </div>
        </div>
        <RecommendationCard recommendation={result.recommendation} />
        <ValidationCard validation={result.validation} />
        <MethodRanking multiMethod={result.multi_method} />
        <ScoreTable ratings={result.evaluation.ratings} />
      </div>
    );
  }

  return null;
}

function composeResult(raw: unknown): CmgcRunResult | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const evaluate = r.evaluate as { ratings?: unknown } | undefined;
  const score = r.score as { recommendation?: unknown; multi_method?: unknown } | undefined;
  const validate = r.validate as unknown;
  const extract = r.extract as { projectName?: string } | undefined;
  if (!evaluate?.ratings || !score?.recommendation || !score?.multi_method) return null;
  return {
    evaluation: {
      project_name: extract?.projectName ?? "Untitled Project",
      project_ea: "",
      district: "",
      evaluation_date: new Date().toISOString().slice(0, 10),
      ratings: evaluate.ratings as never,
      missing_questions: [],
      summary: "",
    },
    recommendation: score.recommendation as never,
    multi_method: score.multi_method as never,
    validation: (validate as never) ?? null,
  };
}

async function downloadExport(useCaseId: string, exporterId: string, label: string, result: CmgcRunResult) {
  const res = await fetch(`/api/usecases/${useCaseId}/export/${exporterId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result),
  });
  if (!res.ok) {
    alert(`${label} failed (${res.status})`);
    return;
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${useCaseId}-${exporterId}.${exporterId === "docx" ? "docx" : "xlsx"}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
