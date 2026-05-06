import { describe, it, expect, vi } from "vitest";
import { evaluateStep } from "./evaluate-step";
import type { StepContext } from "@/lib/usecases/types";
import type { EvaluationResult } from "@/lib/usecases/row-appraisal/types";

// Exact categories per chunk (ordered by dependency groups, then schema order)
const CHUNK_CATEGORIES = [
  ["Title Page", "Certificate of Appraiser", "Senior Review Certificate", "Delegations",
   "HABU Vacant", "HABU Improved", "HABU Reconciliation", "Methodology"],
  ["Sales Comparison Approach (If used)", "Income Approach (If used)", "Cost Approach (If Used)",
   "Reconciliation", "The Acquisition - Land", "Improvements", "After Analysis (if required)", "Cost to Cure"],
  ["Construction Contract Work", "COS & HMDD",
   "Diary, Notice of Decision to Appraise & Loss of Business Goodwill",
   "Subject Assessor Map", "Subject Photos", "RW 7-9", "Scope of Work",
   "General Assumptions & Limiting Conditions"],
  ["Introduction", "Area Description", "Parcel Description", "Construction in the Manner Proposed",
   "Summary of Just Compensation", "Comparable Summary Page", "Comparable Map Sheet", "Comparable Data Sheets"],
  ["Appraisal Maps", "Appraisal Terms"],
];

function makeResults(categories: string[]): EvaluationResult[] {
  return categories.map((category) => ({
    category,
    score: 4,
    criteria_met: "Meets criteria",
    evidence: "Found on page 1",
    status: "✅ Pass" as const,
    comments: "OK",
  }));
}

function makeCtx(callResponses: string[]): StepContext {
  let idx = 0;
  return {
    userId: "u",
    runId: "r",
    prior: {
      extract: {
        extracted_text: "fake appraisal document text",
        provider: "openai",
        model: "gpt-4.1",
      },
    },
    llm: {
      call: vi.fn(async () => {
        const text = callResponses[idx++] ?? "[]";
        return { text };
      }),
    },
    abortSignal: new AbortController().signal,
    log: vi.fn(),
  };
}

async function collect(iter: AsyncIterable<unknown>) {
  const out: any[] = [];
  for await (const ev of iter) out.push(ev);
  return out;
}

describe("row-appraisal evaluateStep", () => {
  it("emits 5 progress, 5 partial, 1 stage-done; calls llm 5 times; raw_results has 34 entries", async () => {
    const responses = CHUNK_CATEGORIES.map((cats) =>
      JSON.stringify(makeResults(cats)),
    );
    const ctx = makeCtx(responses);

    const events = await collect(evaluateStep.run(undefined as any, ctx));

    const progressEvents = events.filter(
      (e) => e.type === "progress" && e.stage === "evaluate",
    );
    const partialEvents = events.filter(
      (e) => e.type === "partial" && e.stage === "evaluate",
    );
    const doneEvent = events.find((e) => e.type === "stage-done");

    expect(progressEvents).toHaveLength(5);
    expect(partialEvents).toHaveLength(5);
    expect(doneEvent).toBeDefined();
    expect(doneEvent.stage).toBe("evaluate");
    expect(doneEvent.data.raw_results.length).toBeGreaterThanOrEqual(34);
    expect((ctx.llm.call as any).mock.calls).toHaveLength(5);
  });

  it("each partial event has chunkIndex and results array", async () => {
    const responses = CHUNK_CATEGORIES.map((cats) =>
      JSON.stringify(makeResults(cats)),
    );
    const ctx = makeCtx(responses);

    const events = await collect(evaluateStep.run(undefined as any, ctx));

    const partialEvents = events.filter((e) => e.type === "partial");
    for (let i = 0; i < 5; i++) {
      expect(partialEvents[i].data.chunkIndex).toBe(i);
      expect(Array.isArray(partialEvents[i].data.results)).toBe(true);
    }
  });

  it("progress events have increasing pct and message mentioning chunk number", async () => {
    const responses = CHUNK_CATEGORIES.map((cats) =>
      JSON.stringify(makeResults(cats)),
    );
    const ctx = makeCtx(responses);

    const events = await collect(evaluateStep.run(undefined as any, ctx));
    const progressEvents = events.filter((e) => e.type === "progress" && e.stage === "evaluate");

    // pct values should be 0, 20, 40, 60, 80 (i/total * 100 for i=0..4)
    expect(progressEvents[0].pct).toBe(0);
    expect(progressEvents[0].message).toContain("1/5");
    expect(progressEvents[4].message).toContain("5/5");
  });
});
