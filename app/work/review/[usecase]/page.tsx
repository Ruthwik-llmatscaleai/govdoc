"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { usePipelineStore } from "@/store/use-pipeline";
import { getUseCase } from "@/lib/usecases/registry";
import { InputsForm as CmgcInputsForm } from "@/components/work/cmgc/inputs-form";
import { ScoreTable } from "@/components/work/cmgc/score-table";
import { RecommendationCard } from "@/components/work/cmgc/recommendation-card";
import { MethodRanking } from "@/components/work/cmgc/method-ranking";
import { ValidationCard } from "@/components/work/cmgc/validation-card";
import { InputsForm as CucpInputsForm } from "@/components/work/cucp/inputs-form";
import { CriteriaTable } from "@/components/work/cucp/criteria-table";
import { FactsList } from "@/components/work/cucp/facts-list";
import { ClassificationsList } from "@/components/work/cucp/classifications-list";
import { ReportView } from "@/components/work/cucp/report-view";
import type { CmgcRunResult } from "@/lib/usecases/cmgc-pde/types";
import type { Level1Data, Level2Data, Level3Data } from "@/lib/usecases/cucp-reevals/types";

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

  if (usecase === "cmgc-pde") {
    return <CmgcView ucLabel={uc.label} ucBlurb={uc.blurb} exporters={uc.exporters} current={current} reset={reset} />;
  }
  if (usecase === "cucp-reevals") {
    return <CucpView ucLabel={uc.label} ucBlurb={uc.blurb} exporters={uc.exporters} current={current} reset={reset} />;
  }
  return <div className="p-6">Use case <code>{usecase}</code> not yet implemented.</div>;
}

type ViewProps = {
  ucLabel: string;
  ucBlurb: string;
  exporters: { id: string; label: string }[];
  current: ReturnType<typeof usePipelineStore.getState>["current"];
  reset: () => void;
};

function CmgcView({ ucLabel, ucBlurb, exporters, current, reset }: ViewProps) {
  if (!current || (current.status === "idle" && Object.keys(current.stages).length === 0)) {
    return (
      <div className="p-6 space-y-4 max-w-2xl">
        <h1 className="text-2xl font-bold">{ucLabel}</h1>
        <p className="text-muted-foreground">{ucBlurb}</p>
        <CmgcInputsForm />
      </div>
    );
  }

  if (current.status === "running" || current.status === "needs-input") {
    return <RunningPanel ucLabel={ucLabel} current={current} reset={reset} />;
  }

  if (current.status === "error") {
    return <ErrorPanel ucLabel={ucLabel} current={current} reset={reset} />;
  }

  if (current.status === "done" && current.result) {
    const result = composeCmgcResult(current.result);
    if (!result) return <div className="p-6">Result missing expected stages.</div>;
    return (
      <div className="p-6 space-y-6 max-w-6xl">
        <DoneHeader ucLabel={ucLabel} useCaseId="cmgc-pde" exporters={exporters} result={result} reset={reset} />
        <RecommendationCard recommendation={result.recommendation} />
        <ValidationCard validation={result.validation} />
        <MethodRanking multiMethod={result.multi_method} />
        <ScoreTable ratings={result.evaluation.ratings} />
      </div>
    );
  }
  return null;
}

function CucpView({ ucLabel, ucBlurb, exporters, current, reset }: ViewProps) {
  const [overridesSubmitted, setOverridesSubmitted] = useState(false);

  if (!current || (current.status === "idle" && Object.keys(current.stages).length === 0)) {
    return (
      <div className="p-6 space-y-4 max-w-2xl">
        <h1 className="text-2xl font-bold">{ucLabel}</h1>
        <p className="text-muted-foreground">{ucBlurb}</p>
        <CucpInputsForm />
      </div>
    );
  }

  if (current.status === "needs-input" && !overridesSubmitted) {
    const level1 = (current.stages.level1?.data ?? {}) as Level1Data;
    const level2 = (current.stages.level2?.data ?? {}) as Level2Data;
    const level3 = (current.stages.level3?.data ?? { criteria: [] }) as Level3Data;
    return (
      <div className="p-6 space-y-6 max-w-6xl">
        <h1 className="text-2xl font-bold">{ucLabel}</h1>
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Extracted facts</h2>
          <FactsList facts={level1.extracted_facts ?? []} />
        </section>
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Classifications</h2>
          <ClassificationsList classifications={level2.classifications ?? []} />
        </section>
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">7-criteria review</h2>
          <CriteriaTable
            criteria={level3.criteria ?? []}
            runId={current.runId}
            onSubmitted={() => setOverridesSubmitted(true)}
          />
        </section>
        <button type="button" onClick={reset}>Cancel</button>
      </div>
    );
  }

  if (current.status === "running" || current.status === "needs-input") {
    return <RunningPanel ucLabel={ucLabel} current={current} reset={reset} />;
  }

  if (current.status === "error") {
    return <ErrorPanel ucLabel={ucLabel} current={current} reset={reset} />;
  }

  if (current.status === "done" && current.result) {
    const result = current.result as Record<string, unknown>;
    const report = result.report as { markdown_report?: string } | undefined;
    return (
      <div className="p-6 space-y-6 max-w-6xl">
        <DoneHeader ucLabel={ucLabel} useCaseId="cucp-reevals" exporters={exporters} result={result} reset={reset} />
        <ReportView markdown={report?.markdown_report ?? "_No report generated._"} />
      </div>
    );
  }
  return null;
}

function RunningPanel({ ucLabel, current, reset }: { ucLabel: string; current: NonNullable<ViewProps["current"]>; reset: () => void }) {
  return (
    <div className="p-6 space-y-4 max-w-2xl">
      <h1 className="text-2xl font-bold">{ucLabel}</h1>
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

function ErrorPanel({ ucLabel, current, reset }: { ucLabel: string; current: NonNullable<ViewProps["current"]>; reset: () => void }) {
  return (
    <div className="p-6 space-y-4 max-w-2xl">
      <h1 className="text-2xl font-bold">{ucLabel}</h1>
      <div className="border border-red-300 bg-red-50 p-3 rounded">
        {Object.values(current.stages).find((s) => s.status === "error")?.error ?? "Unknown error"}
      </div>
      <button type="button" onClick={reset}>Start over</button>
    </div>
  );
}

function DoneHeader({
  ucLabel,
  useCaseId,
  exporters,
  result,
  reset,
}: {
  ucLabel: string;
  useCaseId: string;
  exporters: { id: string; label: string }[];
  result: unknown;
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">{ucLabel}</h1>
      <div className="flex gap-2">
        {exporters.map((e) => (
          <button key={e.id} type="button" onClick={() => downloadExport(useCaseId, e.id, e.label, result)}>
            {e.label}
          </button>
        ))}
        <button type="button" onClick={reset}>Run again</button>
      </div>
    </div>
  );
}

function composeCmgcResult(raw: unknown): CmgcRunResult | null {
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

async function downloadExport(useCaseId: string, exporterId: string, label: string, result: unknown) {
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
  const ext = exporterId === "docx" ? "docx" : exporterId === "json" ? "json" : "xlsx";
  a.download = `${useCaseId}-${exporterId}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
