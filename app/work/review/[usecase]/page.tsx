"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Download,
  FileCheck2,
  Loader2,
  MapPin,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import { usePipelineStore } from "@/store/use-pipeline";
import { getUseCaseMetadata } from "@/lib/usecases/metadata";
import {
  WorkBreadcrumbs,
  WorkCard,
  WorkPageHeader,
} from "@/components/work/page-shell";
import {
  PrimaryButton,
  SecondaryButton,
} from "@/components/work/form-fields";
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
import { ActionItems as RowActionItems } from "@/components/work/row/action-items";
import { ExecSummary as RowExecSummary } from "@/components/work/row/exec-summary";
import { FindingsTable as RowFindingsTable } from "@/components/work/row/findings-table";
import { InputsForm as RowInputsForm } from "@/components/work/row/inputs-form";
import { ResultsTable as RowResultsTable } from "@/components/work/row/results-table";
import { ScoreSummary as RowScoreSummary } from "@/components/work/row/score-summary";
import type { CmgcRunResult } from "@/lib/usecases/cmgc-pde/types";
import type { Level1Data, Level2Data, Level3Data } from "@/lib/usecases/cucp-reevals/types";
import type { RowRunResult } from "@/lib/usecases/row-appraisal/types";
import { USE_CASE_TONE } from "@/components/work/use-case-tone";
import type { UseCaseId } from "@/lib/usecases/types";

type RouteParams = { usecase: string };

const USECASE_ICON: Record<string, LucideIcon> = {
  "cmgc-pde": Building2,
  "cucp-reevals": FileCheck2,
  "row-appraisal": MapPin,
};

const USECASE_EYEBROW: Record<string, string> = {
  "cmgc-pde": "Procurement & Contract · CMGC",
  "cucp-reevals": "Certification & Eligibility · CUCP",
  "row-appraisal": "Real Property & Appraisal · ROW",
};

const HOW_IT_WORKS: Record<string, string[]> = {
  "cmgc-pde": [
    "Upload one or more nomination fact sheets (DOCX/PDF).",
    "GovDoc rates the project across the 32-category PDE rubric and scores delivery method fit.",
    "You review the recommendation, validate it, and export DOCX or XLSX.",
  ],
  "cucp-reevals": [
    "Upload the firm's Personal Narrative Statement (and revenues if available).",
    "Three-pass review runs: facts extracted, §26.67 criteria evaluated, classifications surfaced.",
    "You confirm or override criteria. GovDoc generates the final eligibility report.",
  ],
  "row-appraisal": [
    "Upload the appraisal PDF (one of the four bundled samples is recommended for Phase 1).",
    "GovDoc scores the report against the 34-category rubric using the chosen LLM provider.",
    "You review category-level scores and export to Excel or DOCX.",
  ],
};

export default function UseCasePage({ params }: { params: Promise<RouteParams> }) {
  const { usecase } = use(params);
  const router = useRouter();
  const current = usePipelineStore((s) => s.current);
  const reset = usePipelineStore((s) => s.reset);

  const uc = getUseCaseMetadata(usecase);
  if (!uc) {
    return (
      <div className="space-y-4">
        <WorkBreadcrumbs
          crumbs={[
            { label: "Landing", href: "/landing" },
            { label: "Review Documents", href: "/work/review" },
            { label: "Unknown" },
          ]}
        />
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">Unknown use case.</p>
          <button
            type="button"
            onClick={() => router.push("/work/review")}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="size-3.5" /> Back to picker
          </button>
        </div>
      </div>
    );
  }

  const Icon = USECASE_ICON[usecase] ?? CheckCircle2;
  const eyebrow = USECASE_EYEBROW[usecase];
  const steps = HOW_IT_WORKS[usecase] ?? [];

  const tone = USE_CASE_TONE[usecase as UseCaseId];
  const headerBlock = (
    <>
      <WorkBreadcrumbs
        crumbs={[
          { label: "Landing", href: "/landing" },
          { label: "Review Documents", href: "/work/review" },
          { label: uc.label },
        ]}
      />
      <WorkPageHeader
        icon={Icon}
        eyebrow={eyebrow}
        title={uc.label}
        blurb={uc.blurb}
        tone={tone}
      />
    </>
  );

  if (usecase === "cmgc-pde") {
    return (
      <div className="space-y-6">
        {headerBlock}
        <CmgcView ucLabel={uc.label} steps={steps} exporters={uc.exporters} current={current} reset={reset} />
      </div>
    );
  }
  if (usecase === "cucp-reevals") {
    return (
      <div className="space-y-6">
        {headerBlock}
        <CucpView ucLabel={uc.label} steps={steps} exporters={uc.exporters} current={current} reset={reset} />
      </div>
    );
  }
  if (usecase === "row-appraisal") {
    return (
      <div className="space-y-6">
        {headerBlock}
        <RowView ucLabel={uc.label} steps={steps} exporters={uc.exporters} current={current} reset={reset} />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {headerBlock}
      <div className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
        Use case <code className="rounded bg-muted px-1 py-0.5">{usecase}</code> not yet implemented.
      </div>
    </div>
  );
}

type ViewProps = {
  ucLabel: string;
  steps: string[];
  exporters: { id: string; label: string }[];
  current: ReturnType<typeof usePipelineStore.getState>["current"];
  reset: () => void;
};

function HowItWorks({ steps }: { steps: string[] }) {
  if (steps.length === 0) return null;
  return (
    <WorkCard title="How it works">
      <ol className="space-y-3">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-3 text-sm">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
              {i + 1}
            </span>
            <span className="text-foreground/85 leading-relaxed">{s}</span>
          </li>
        ))}
      </ol>
    </WorkCard>
  );
}

function IdleLayout({
  steps,
  inputs,
}: {
  steps: string[];
  inputs: React.ReactNode;
}) {
  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      <WorkCard title="Inputs" description="Provide the documents to evaluate.">
        {inputs}
      </WorkCard>
      <HowItWorks steps={steps} />
    </div>
  );
}

function CmgcView({ ucLabel, steps, exporters, current, reset }: ViewProps) {
  if (!current || (current.status === "idle" && Object.keys(current.stages).length === 0)) {
    return <IdleLayout steps={steps} inputs={<CmgcInputsForm />} />;
  }
  if (current.status === "running" || current.status === "needs-input") {
    return <RunningPanel current={current} reset={reset} />;
  }
  if (current.status === "error") {
    return <ErrorPanel current={current} reset={reset} />;
  }
  if (current.status === "done" && current.result) {
    const result = composeCmgcResult(current.result);
    if (!result)
      return <DebugRawResult raw={current.result} reset={reset} expected={["evaluate.ratings", "score.recommendation", "score.multi_method"]} />;
    return (
      <div className="space-y-6">
        <DoneActionsBar
          ucLabel={ucLabel}
          useCaseId="cmgc-pde"
          exporters={exporters}
          result={result}
          reset={reset}
        />
        <RecommendationCard recommendation={result.recommendation} />
        <ValidationCard validation={result.validation} />
        <MethodRanking multiMethod={result.multi_method} />
        <ScoreTable ratings={result.evaluation.ratings} />
      </div>
    );
  }
  return null;
}

function CucpView({ ucLabel, steps, exporters, current, reset }: ViewProps) {
  const [overridesSubmitted, setOverridesSubmitted] = useState(false);

  if (!current || (current.status === "idle" && Object.keys(current.stages).length === 0)) {
    return <IdleLayout steps={steps} inputs={<CucpInputsForm />} />;
  }

  if (current.status === "needs-input" && !overridesSubmitted) {
    const level1 = (current.stages.level1?.data ?? {}) as Level1Data;
    const level2 = (current.stages.level2?.data ?? {}) as Level2Data;
    const level3 = (current.stages.level3?.data ?? { criteria: [] }) as Level3Data;
    return (
      <div className="space-y-6">
        <WorkCard
          title="Reviewer override"
          description="GovDoc has completed the three review passes. Confirm or correct the criteria below before generating the final report."
        >
          <div className="space-y-6">
            <section>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Extracted facts
              </h3>
              <FactsList facts={level1.extracted_facts ?? []} />
            </section>
            <section>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Classifications
              </h3>
              <ClassificationsList classifications={level2.classifications ?? []} />
            </section>
            <section>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                7-criteria review
              </h3>
              <CriteriaTable
                criteria={level3.criteria ?? []}
                runId={current.runId}
                onSubmitted={() => setOverridesSubmitted(true)}
              />
            </section>
          </div>
        </WorkCard>
        <div className="flex justify-end">
          <SecondaryButton onClick={reset}>Cancel</SecondaryButton>
        </div>
      </div>
    );
  }

  if (current.status === "running" || current.status === "needs-input") {
    return <RunningPanel current={current} reset={reset} />;
  }
  if (current.status === "error") {
    return <ErrorPanel current={current} reset={reset} />;
  }
  if (current.status === "done" && current.result) {
    const result = current.result as Record<string, unknown>;
    const report = result.report as { markdown_report?: string } | undefined;
    return (
      <div className="space-y-6">
        <DoneActionsBar
          ucLabel={ucLabel}
          useCaseId="cucp-reevals"
          exporters={exporters}
          result={result}
          reset={reset}
        />
        <ReportView markdown={report?.markdown_report ?? "_No report generated._"} />
      </div>
    );
  }
  return null;
}

function RowView({ ucLabel, steps, exporters, current, reset }: ViewProps) {
  if (!current || (current.status === "idle" && Object.keys(current.stages).length === 0)) {
    return <IdleLayout steps={steps} inputs={<RowInputsForm />} />;
  }
  if (current.status === "running" || current.status === "needs-input") {
    return <RunningPanel current={current} reset={reset} />;
  }
  if (current.status === "error") {
    return <ErrorPanel current={current} reset={reset} />;
  }
  if (current.status === "done" && current.result) {
    const prior = current.result as Record<string, unknown>;
    const rowResult = prior.consolidate as RowRunResult;
    if (!rowResult?.evaluation_results)
      return <DebugRawResult raw={current.result} reset={reset} expected={["consolidate.evaluation_results"]} />;
    return (
      <div className="space-y-6">
        <DoneActionsBar
          ucLabel={ucLabel}
          useCaseId="row-appraisal"
          exporters={exporters}
          result={rowResult}
          reset={reset}
        />
        <RowScoreSummary results={rowResult.evaluation_results} />
        <WorkCard title="Action items" description="Categories below score 5, prioritised HIGH / MEDIUM / LOW.">
          <RowActionItems results={rowResult.evaluation_results} />
        </WorkCard>
        <WorkCard title="Executive summary" description="Per-category status roll-up.">
          <RowExecSummary results={rowResult.evaluation_results} />
        </WorkCard>
        <WorkCard title="Detailed results" description="Full rubric evaluation per category.">
          <RowResultsTable results={rowResult.evaluation_results} />
        </WorkCard>
        <WorkCard title="Detailed findings" description="Each rubric rule scored 1 (met) or 0 (not met).">
          <RowFindingsTable results={rowResult.evaluation_results} />
        </WorkCard>
      </div>
    );
  }
  return null;
}

function RunningPanel({
  current,
  reset,
}: {
  current: NonNullable<ViewProps["current"]>;
  reset: () => void;
}) {
  return (
    <WorkCard
      title="Running pipeline"
      description="GovDoc is processing your inputs. This may take a few minutes."
    >
      <ul className="space-y-2">
        {Object.values(current.stages).map((stage) => {
          const done = stage.status === "done";
          const error = stage.status === "error";
          return (
            <li
              key={stage.id}
              className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm ${
                error
                  ? "border-destructive/30 bg-destructive/5"
                  : done
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-border bg-muted/30"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {done ? (
                  <CheckCircle2 className="size-4 text-emerald-600" />
                ) : error ? (
                  <AlertTriangle className="size-4 text-destructive" />
                ) : (
                  <Loader2 className="size-4 animate-spin text-primary" />
                )}
                <span className="font-medium text-foreground">
                  {stage.label || stage.id}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {stage.status}
                {stage.pct > 0 && ` · ${stage.pct}%`}
                {stage.message && ` · ${stage.message}`}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="mt-5 flex justify-end">
        <SecondaryButton onClick={reset}>Cancel</SecondaryButton>
      </div>
    </WorkCard>
  );
}

function ErrorPanel({
  current,
  reset,
}: {
  current: NonNullable<ViewProps["current"]>;
  reset: () => void;
}) {
  const errMsg =
    Object.values(current.stages).find((s) => s.status === "error")?.error ??
    "Unknown error";
  return (
    <WorkCard>
      <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <AlertTriangle className="size-5 shrink-0 text-destructive" />
        <div className="flex-1 space-y-1">
          <h3 className="text-sm font-semibold text-destructive">
            Pipeline failed
          </h3>
          <p className="text-sm text-foreground/85">{errMsg}</p>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <SecondaryButton onClick={reset}>
          <RotateCcw className="size-4" /> Start over
        </SecondaryButton>
      </div>
    </WorkCard>
  );
}

function DoneActionsBar({
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
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-3.5">
      <div className="flex items-center gap-2.5">
        <CheckCircle2 className="size-5 text-emerald-600" />
        <div className="space-y-0.5">
          <div className="text-sm font-semibold text-foreground">
            {ucLabel} complete
          </div>
          <div className="text-xs text-muted-foreground">
            Review the results below and export when ready.
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {exporters.map((e) => (
          <SecondaryButton
            key={e.id}
            onClick={() => downloadExport(useCaseId, e.id, e.label, result)}
          >
            <Download className="size-4" /> {e.label}
          </SecondaryButton>
        ))}
        <PrimaryButton type="button" onClick={reset}>
          <RotateCcw className="size-4" /> Run again
        </PrimaryButton>
      </div>
    </div>
  );
}

function DebugRawResult({
  raw,
  reset,
  expected,
}: {
  raw: unknown;
  reset: () => void;
  expected: string[];
}) {
  const json = JSON.stringify(raw, null, 2);
  const truncated = json.length > 8000 ? json.slice(0, 8000) + "\n…(truncated)" : json;
  const topLevelKeys =
    raw && typeof raw === "object" ? Object.keys(raw as Record<string, unknown>).join(", ") : "(non-object)";
  return (
    <WorkCard title="Pipeline returned an unexpected shape">
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          The pipeline finished but the result is missing expected fields. Expected:{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-[11px]">{expected.join(", ")}</code>.
          Got top-level keys:{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-[11px]">{topLevelKeys}</code>.
        </p>
        <pre className="max-h-96 overflow-auto rounded-lg border border-border bg-muted/30 p-3 text-[11px] leading-snug">
{truncated}
        </pre>
        <div className="flex justify-end">
          <SecondaryButton onClick={reset}>
            <RotateCcw className="size-4" /> Start over
          </SecondaryButton>
        </div>
      </div>
    </WorkCard>
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
