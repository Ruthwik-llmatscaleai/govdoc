"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { StepBar } from "@/components/work/shared/step-bar";
import { OverrideCard } from "./override-card";
import type { OverrideCardQuestion } from "./override-card";
import type { Rating } from "@/lib/usecases/cmgc-pde/rubric";
import { ReportView } from "@/components/work/cucp/report-view";

export type HiflOverrideEntry = {
  question_id: string;
  oldValue: Rating;
  newValue: Rating;
  reason: string;
};

type Step = "review" | "export";

const STEPS = [
  { id: "review", label: "Review & Override" },
  { id: "export", label: "Export" },
] as const;

// Threshold for "missing info": questions where the AI confidence is below this value
// OR the source reasoning is empty are surfaced in the "Missing Info Only" filter.
const MISSING_CONFIDENCE_THRESHOLD = 0.7;

export function HiflWizard({
  questions,
  recommendationLabel,
  overrides,
  markdownReport,
  previewTable,
  onSaveOverride,
  onRemoveOverride,
}: {
  questions: readonly OverrideCardQuestion[];
  recommendationLabel: string;
  overrides: readonly HiflOverrideEntry[];
  markdownReport?: string;
  previewTable?: React.ReactNode;
  onSaveOverride: (entry: HiflOverrideEntry) => void;
  onRemoveOverride: (questionId: string) => void;
}): React.JSX.Element {
  const [currentStep, setCurrentStep] = useState<Step>("review");
  const [acknowledgedNoChanges, setAcknowledgedNoChanges] = useState(false);
  const [filter, setFilter] = useState<"all" | "missing">("all");
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(
    questions[0]?.question_id ?? "",
  );

  const filteredQuestions =
    filter === "missing"
      ? questions.filter(
          (q) =>
            (q.confidence != null && q.confidence < MISSING_CONFIDENCE_THRESHOLD) ||
            q.source_reasoning === "",
        )
      : questions;

  const effectiveSelectedId =
    filteredQuestions.some((q) => q.question_id === selectedQuestionId)
      ? selectedQuestionId
      : (filteredQuestions[0]?.question_id ?? "");

  const selectedQuestion = filteredQuestions.find((q) => q.question_id === effectiveSelectedId);

  const reviewApproved = overrides.length > 0 || acknowledgedNoChanges;
  const nextDisabled = !reviewApproved;

  const approvedIds: string[] = [];
  if (reviewApproved) approvedIds.push("review");
  if (currentStep === "export") approvedIds.push("export");

  const existingOverrideMap = Object.fromEntries(
    overrides.map((o) => [o.question_id, { newRating: o.newValue, reason: o.reason }]),
  );

  function handleJump(id: string) {
    setCurrentStep(id as Step);
  }

  function handleFilterChange(value: "all" | "missing") {
    setFilter(value);
  }

  return (
    <div className="space-y-4">
      <StepBar
        steps={STEPS}
        currentId={currentStep}
        approvedIds={approvedIds}
        onJump={handleJump}
      />

      {/* ── Step 1: Review & Override ── */}
      {currentStep === "review" && (
        <div className="space-y-4">
          <fieldset className="flex items-center gap-4">
            <legend className="text-sm font-medium text-muted-foreground mr-2">Show:</legend>
            <label className="flex items-center gap-1 text-sm cursor-pointer">
              <input
                type="radio"
                name="filter"
                value="all"
                checked={filter === "all"}
                onChange={() => handleFilterChange("all")}
              />
              All Questions
            </label>
            <label className="flex items-center gap-1 text-sm cursor-pointer">
              <input
                type="radio"
                name="filter"
                value="missing"
                checked={filter === "missing"}
                onChange={() => handleFilterChange("missing")}
                aria-label="Missing Info Only"
              />
              Missing Info Only
            </label>
          </fieldset>

          {filteredQuestions.length > 0 ? (
            <div className="space-y-1">
              <label htmlFor="hifl-question-select" className="block text-sm font-medium">
                Select question
              </label>
              <select
                id="hifl-question-select"
                aria-label="Select question"
                value={effectiveSelectedId}
                onChange={(e) => setSelectedQuestionId(e.target.value)}
                className={cn(
                  "h-9 w-full rounded-lg border border-input bg-muted/30 px-2 text-sm",
                  "transition-colors focus:border-primary/40 focus:bg-background",
                  "focus:outline-none focus:ring-2 focus:ring-primary/15",
                )}
              >
                {filteredQuestions.map((q) => (
                  <option key={q.question_id} value={q.question_id}>
                    {q.question_id}{" — "}{q.question_text}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No questions match this filter.</p>
          )}

          {selectedQuestion && (
            <OverrideCard
              key={selectedQuestion.question_id}
              question={{
                ...selectedQuestion,
                existing: existingOverrideMap[selectedQuestion.question_id],
              }}
              onSave={onSaveOverride}
            />
          )}

          {previewTable && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Live preview</h3>
              <p className="text-xs text-muted-foreground">
                Updates immediately as you save corrections. The Effective column reflects your overrides.
              </p>
              {previewTable}
            </div>
          )}

          <div className="rounded-md border border-border bg-muted/20 p-4 space-y-2">
            <h3 className="text-sm font-semibold">Pending Corrections</h3>
            {overrides.length === 0 ? (
              <p className="text-sm text-muted-foreground">No corrections yet.</p>
            ) : (
              <ul className="space-y-2">
                {overrides.map((o) => (
                  <li key={o.question_id} className="flex items-center justify-between gap-2 text-sm">
                    <span>
                      <span className="font-mono font-semibold">{o.question_id}</span>{" "}
                      <span className="text-muted-foreground">
                        {o.oldValue} → {o.newValue}
                      </span>{" "}
                      <span className="italic text-muted-foreground">
                        &ldquo;{o.reason.length > 60 ? o.reason.slice(0, 60) + "…" : o.reason}&rdquo;
                      </span>
                    </span>
                    <button
                      type="button"
                      aria-label="Remove"
                      onClick={() => onRemoveOverride(o.question_id)}
                      className="shrink-0 rounded px-2 py-0.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setAcknowledgedNoChanges(true)}
              className={cn(
                "rounded-md px-3 py-2 text-sm transition-colors",
                "border border-border hover:bg-muted",
                acknowledgedNoChanges && "bg-muted text-muted-foreground cursor-default",
              )}
            >
              {acknowledgedNoChanges
                ? "Acknowledged — no changes needed"
                : "I've reviewed all flagged questions, no changes needed"}
            </button>
            <button
              type="button"
              disabled={nextDisabled}
              onClick={() => setCurrentStep("export")}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              Approve &amp; Export
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Export ── */}
      {currentStep === "export" && (
        <div className="space-y-4">
          <div className="rounded-md border border-l-4 border-border border-l-primary bg-card p-6 space-y-3 shadow-sm">
            <p className="text-lg font-semibold text-foreground">Review complete</p>
            <p className="text-sm text-foreground">
              <span className="font-medium">Final recommendation:</span>{" "}
              <span className="font-semibold">{recommendationLabel}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Your overrides are recorded. Use the Export buttons above to download the full evaluation.
            </p>
          </div>

          {markdownReport && markdownReport.trim().length > 0 && (
            <ReportView markdown={markdownReport} />
          )}

          <div className="flex flex-wrap items-center justify-start gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep("review")}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                "border border-border hover:bg-muted",
              )}
            >
              ← Back to Review
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
