"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { StepBar } from "@/components/work/shared/step-bar";
import { OverrideCard } from "./override-card";
import type { OverrideCardQuestion } from "./override-card";
import { ValidationAudit } from "./validation-audit";
import type { ValidationResult } from "@/lib/usecases/cmgc-pde/types";
import type { Rating } from "@/lib/usecases/cmgc-pde/rubric";

export type HiflOverrideEntry = {
  question_id: string;
  oldValue: Rating;
  newValue: Rating;
  reason: string;
};

type Step = "review" | "validate" | "export";

const STEPS = [
  { id: "review", label: "Review & Override" },
  { id: "validate", label: "Validation Audit" },
  { id: "export", label: "Export" },
] as const;

// Threshold for "missing info": questions where the AI confidence is below this value
// OR the source reasoning is empty are surfaced in the "Missing Info Only" filter.
const MISSING_CONFIDENCE_THRESHOLD = 0.7;

export function HiflWizard({
  questions,
  validation,
  recommendationLabel,
  aiRecommendationLabel,
  recommendationShifted,
  overrides,
  onSaveOverride,
  onRemoveOverride,
}: {
  questions: readonly OverrideCardQuestion[];
  validation: ValidationResult | null;
  recommendationLabel: string;
  aiRecommendationLabel: string;
  recommendationShifted: boolean;
  overrides: readonly HiflOverrideEntry[];
  onSaveOverride: (entry: HiflOverrideEntry) => void;
  onRemoveOverride: (questionId: string) => void;
}): React.JSX.Element {
  const [currentStep, setCurrentStep] = useState<Step>("review");
  const [acknowledgedNoChanges, setAcknowledgedNoChanges] = useState(false);
  const [validateApproved, setValidateApproved] = useState(false);
  const [filter, setFilter] = useState<"all" | "missing">("all");
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(
    questions[0]?.question_id ?? "",
  );

  // Filtered list based on "all" vs "missing" radio
  const filteredQuestions =
    filter === "missing"
      ? questions.filter(
          (q) =>
            (q.confidence != null && q.confidence < MISSING_CONFIDENCE_THRESHOLD) ||
            q.source_reasoning === "",
        )
      : questions;

  // Ensure selectedQuestionId is always in the filtered list
  const effectiveSelectedId =
    filteredQuestions.some((q) => q.question_id === selectedQuestionId)
      ? selectedQuestionId
      : (filteredQuestions[0]?.question_id ?? "");

  const selectedQuestion = filteredQuestions.find((q) => q.question_id === effectiveSelectedId);

  // Gate logic
  const reviewApproved = overrides.length > 0 || acknowledgedNoChanges;
  const nextDisabled = !reviewApproved;

  const approvedIds: string[] = [];
  if (reviewApproved) approvedIds.push("review");
  if (validateApproved) approvedIds.push("validate");
  if (currentStep === "export") approvedIds.push("export");

  // Override reasons for ValidationAudit
  const overrideReasons = Object.fromEntries(overrides.map((o) => [o.question_id, o.reason]));

  // Existing override map for OverrideCard (so it can pre-fill the saved values)
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
          {/* Question filter */}
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

          {/* Question selector */}
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

          {/* Selected question override card.
              key forces remount when the question changes so internal form state resets cleanly. */}
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

          {/* Pending Corrections */}
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

          {/* Footer */}
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
              onClick={() => setCurrentStep("validate")}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              Next → Validation
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Validation Audit ── */}
      {currentStep === "validate" && (
        <div className="space-y-4">
          <ValidationAudit validation={validation} overrideReasons={overrideReasons} />
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep("review")}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                "border border-border hover:bg-muted",
              )}
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => {
                setValidateApproved(true);
                setCurrentStep("export");
              }}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                "bg-primary text-primary-foreground hover:bg-primary/90",
              )}
            >
              Approve & Export
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Export ── */}
      {currentStep === "export" && (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 p-6 space-y-2 text-emerald-900">
          <p className="text-lg font-semibold">✅ Review complete</p>
          <p>
            <span className="font-medium">Final recommendation:</span> {recommendationLabel}
            {recommendationShifted && (
              <span className="ml-2 text-sm italic">
                (shifted from {aiRecommendationLabel})
              </span>
            )}
          </p>
          <p className="text-sm text-emerald-800">
            Your overrides are recorded. Use the Export buttons above to download.
          </p>
        </div>
      )}
    </div>
  );
}
