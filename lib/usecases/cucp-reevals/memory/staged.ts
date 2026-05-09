import type { Classification, Criterion } from "@/lib/usecases/cucp-reevals/types";
import type { Precedent } from "./precedents";

export type L2OverridePayload = {
  fact_id: string;
  new_category: string;
  reason: string;
};

export type L3OverridePayload = {
  s_no: string;
  verdict: "Pass" | "Fail";
  request_info: "Yes" | "No";
  reason: string;
};

export function l2OverrideToPrecedent(
  override: L2OverridePayload,
  classifications: readonly Classification[],
): Precedent {
  const prior = classifications.find((c) => c.fact_id === override.fact_id);
  const target = prior?.classification ?? override.fact_id;
  const correction =
    override.new_category === "Keep Current (Fix Reasoning Only)" && prior?.classification
      ? prior.classification
      : override.new_category;
  return {
    target,
    correction,
    human_reasoning: override.reason,
    fact_id: override.fact_id,
  };
}

export function l3OverrideToPrecedent(
  override: L3OverridePayload,
  criteria: readonly Criterion[],
): Precedent {
  const sNo = Number(override.s_no);
  const prior = criteria.find((c) => c.s_no === sNo);
  const target =
    prior?.qualification && prior.qualification.trim().length > 0
      ? prior.qualification
      : `Criterion ${sNo}`;
  const correction =
    override.request_info === "Yes" ? `${override.verdict} (request_info=Yes)` : override.verdict;
  return {
    target,
    correction,
    human_reasoning: override.reason,
    s_no: sNo,
  };
}
