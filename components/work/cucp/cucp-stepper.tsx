"use client";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { StepBar, type StepBarStep } from "../shared/step-bar";
import { L1FactsTable } from "./l1-facts-table";
import {
  L2ClassificationsTable,
  type L2Row,
  type L2OverridePayload,
} from "./l2-classifications-table";
import { L3CriteriaTable, type L3OverrideMap } from "./l3-criteria-table";
import { L3OverrideForm, type L3OverridePayload } from "./l3-override-form";
import { RequestInfoBanner } from "./request-info-banner";
import type { ExtractedFact, Criterion } from "@/lib/usecases/cucp-reevals/types";

type StepId = "l1" | "l2" | "l3" | "done";

const STEPS: readonly StepBarStep[] = [
  { id: "l1", label: "Facts (W5)" },
  { id: "l2", label: "Legal Categories" },
  { id: "l3", label: "Criteria" },
  { id: "done", label: "Done" },
];

const PRIMARY_BTN_CLASS = cn(
  "rounded-md px-4 py-2 text-sm font-medium transition-colors",
  "bg-primary text-primary-foreground hover:bg-primary/90",
);

const SECONDARY_BTN_CLASS = cn(
  "rounded-md border border-border bg-background px-3 py-2 text-sm",
  "transition-colors hover:bg-muted",
);

export type CucpStepperSubmitPayload = {
  l2: L2OverridePayload[];
  l3: L3OverridePayload[];
};

export function CucpStepper({
  facts,
  classifications,
  criteria,
  onSubmit,
}: {
  facts: readonly ExtractedFact[];
  classifications: readonly L2Row[];
  criteria: readonly Criterion[];
  onSubmit: (payload: CucpStepperSubmitPayload) => void;
}): React.JSX.Element {
  const [step, setStep] = useState<StepId>("l1");
  const [l1Approved, setL1Approved] = useState(false);
  const [l2Overrides, setL2Overrides] = useState<L2OverridePayload[]>([]);
  const [l2Approved, setL2Approved] = useState(false);
  const [l3Overrides, setL3Overrides] = useState<L3OverridePayload[]>([]);

  const l3OverrideMap = useMemo<L3OverrideMap>(() => {
    const m: L3OverrideMap = {};
    for (const o of l3Overrides) {
      m[o.s_no] = { verdict: o.verdict, request_info: o.request_info, reason: o.reason };
    }
    return m;
  }, [l3Overrides]);

  // request_info=Yes flips final_decision per caltrans cucp_reevals.py:207.
  // Either an analyst override OR the original AI verdict can set it.
  const requestInfoSet =
    l3Overrides.some((o) => o.request_info === "Yes") ||
    criteria.some(
      (c) =>
        c.request_info === "Yes" && l3OverrideMap[String(c.s_no)] === undefined,
    );

  const approvedIds: StepId[] = [];
  if (l1Approved) approvedIds.push("l1");
  if (l2Approved) approvedIds.push("l2");

  // Adapt Criterion[] → L3OverrideForm's lighter shape ({s_no:string, criterion:string}).
  const l3FormCriteria = useMemo(
    () =>
      criteria.map((c) => ({
        s_no: String(c.s_no),
        criterion: c.qualification || c.category || `Criterion ${c.s_no}`,
      })),
    [criteria],
  );

  return (
    <div className="space-y-4">
      <StepBar
        steps={STEPS}
        currentId={step}
        approvedIds={approvedIds}
        onJump={(id) => setStep(id as StepId)}
      />

      {step === "l1" && (
        <div className="space-y-3">
          <L1FactsTable facts={facts} />
          <div className="flex justify-end">
            <button
              type="button"
              className={PRIMARY_BTN_CLASS}
              onClick={() => {
                setL1Approved(true);
                setStep("l2");
              }}
            >
              Approve & Continue →
            </button>
          </div>
        </div>
      )}

      {step === "l2" && (
        <div className="space-y-3">
          <L2ClassificationsTable
            rows={classifications}
            onSaveOverride={(p) =>
              setL2Overrides((prev) => [
                ...prev.filter((x) => x.fact_id !== p.fact_id),
                p,
              ])
            }
          />
          <div className="flex items-center justify-between">
            <button
              type="button"
              className={SECONDARY_BTN_CLASS}
              onClick={() => setStep("l1")}
            >
              ← Back to Facts
            </button>
            <button
              type="button"
              className={PRIMARY_BTN_CLASS}
              onClick={() => {
                setL2Approved(true);
                setStep("l3");
              }}
            >
              Approve & Continue →
            </button>
          </div>
        </div>
      )}

      {step === "l3" && (
        <div className="space-y-3">
          <RequestInfoBanner show={requestInfoSet} />
          <L3CriteriaTable criteria={criteria} overrideMap={l3OverrideMap} />
          <L3OverrideForm
            criteria={l3FormCriteria}
            onSave={(p) =>
              setL3Overrides((prev) => [...prev.filter((x) => x.s_no !== p.s_no), p])
            }
          />
          <div className="flex items-center justify-between">
            <button
              type="button"
              className={SECONDARY_BTN_CLASS}
              onClick={() => setStep("l2")}
            >
              ← Back to Categories
            </button>
            <button
              type="button"
              className={PRIMARY_BTN_CLASS}
              onClick={() => {
                onSubmit({ l2: l2Overrides, l3: l3Overrides });
                setStep("done");
              }}
            >
              Submit & Finalize
            </button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="space-y-3">
          <RequestInfoBanner show={requestInfoSet} />
          <h3 className="text-sm font-semibold">L3 Criteria (final)</h3>
          <L3CriteriaTable criteria={criteria} overrideMap={l3OverrideMap} />
        </div>
      )}
    </div>
  );
}
