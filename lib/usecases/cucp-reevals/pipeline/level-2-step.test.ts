import { describe, it, expect, vi } from "vitest";
import { level2Step } from "./level-2-step";
import type { StepContext } from "@/lib/usecases/types";

const sampleL2 = {
  classifications: [{ fact_id: "fact_1", classification: "Social Disadvantage", summary: "Discriminatory contract exclusion", reasoning: "Applicant experienced bias in contracting" }],
};

function makeCtx(callImpl: any): StepContext {
  return {
    userId: "u", projectId: "_test", runId: "r",
    prior: {
      level1: {
        firm_name: "Acme",
        cross_reference_result: "1500000",
        narrative_pnw: "NOT PROVIDED",
        extracted_facts: [{ id: "fact_1", when: "2025", where: "CA", who: "Owner", what: "lost contract", why: "discrimination", magnitude: "$50k", demographic_flag: true, source_quote: "..." }],
      },
    },
    llm: { call: vi.fn(callImpl) } as any,
    abortSignal: new AbortController().signal, log: vi.fn(),
  };
}

async function collect(iter: AsyncIterable<unknown>) {
  const out: any[] = []; for await (const ev of iter) out.push(ev); return out;
}

describe("level2Step", () => {
  it("emits stage-done with parsed Level2Data on success", async () => {
    const ctx = makeCtx(async () => ({ text: JSON.stringify(sampleL2) }));
    const events = await collect(level2Step.run(new FormData(), ctx));
    const done = events.find((e) => e.type === "stage-done");
    expect(done).toBeDefined();
    expect(done.data.classifications).toHaveLength(1);
    expect(done.data.classifications[0].fact_id).toBe("fact_1");
  });

  it("retries once on JSON parse failure and succeeds", async () => {
    let calls = 0;
    const ctx = makeCtx(async () => {
      calls++;
      return calls === 1 ? { text: "not json" } : { text: JSON.stringify(sampleL2) };
    });
    const events = await collect(level2Step.run(new FormData(), ctx));
    const done = events.find((e) => e.type === "stage-done");
    expect(done).toBeDefined();
    expect(calls).toBe(2);
  });

  it("emits error and logs when both retries fail", async () => {
    const ctx = makeCtx(async () => ({ text: "still not json" }));
    const events = await collect(level2Step.run(new FormData(), ctx));
    const err = events.find((e) => e.type === "error");
    expect(err.message).toBe("AI Level 2 classification failed");
    expect(ctx.log).toHaveBeenCalled();
  });

  it("emits error if provider rejects", async () => {
    const ctx = makeCtx(async () => { throw new Error("upstream-secret"); });
    const events = await collect(level2Step.run(new FormData(), ctx));
    const err = events.find((e) => e.type === "error");
    expect(err.message).toBe("AI Level 2 classification failed");
    expect(err.message).not.toContain("upstream-secret");
  });
});
