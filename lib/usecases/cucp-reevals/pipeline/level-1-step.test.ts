import { describe, it, expect, vi } from "vitest";
import { level1Step } from "./level-1-step";
import type { StepContext } from "@/lib/usecases/types";

const sampleL1 = {
  firm_name: "Acme",
  cross_reference_result: "1500000",
  narrative_pnw: "NOT PROVIDED",
  extracted_facts: [{ id: "fact_1", when: "2025", where: "CA", who: "Owner", what: "lost contract", why: "discrimination", magnitude: "$50k", demographic_flag: true, source_quote: "..." }],
};

function makeCtx(callImpl: any): StepContext {
  return {
    userId: "u", projectId: "_test", runId: "r",
    prior: { extract: { narrativeText: "body", firmRevenues: {} } },
    staged: { level_1_precedents: [], level_2_precedents: [], level_3_precedents: [] },
    llm: { call: vi.fn(callImpl) } as any,
    abortSignal: new AbortController().signal, log: vi.fn(),
  };
}

async function collect(iter: AsyncIterable<unknown>) {
  const out: any[] = []; for await (const ev of iter) out.push(ev); return out;
}

describe("level1Step", () => {
  it("emits stage-done with parsed Level1Data on first-try success", async () => {
    const ctx = makeCtx(async () => ({ text: JSON.stringify(sampleL1) }));
    const events = await collect(level1Step.run(new FormData(), ctx));
    const done = events.find((e) => e.type === "stage-done");
    expect(done.data.firm_name).toBe("Acme");
    expect(done.data.extracted_facts).toHaveLength(1);
  });

  it("retries once on JSON parse failure and succeeds", async () => {
    let calls = 0;
    const ctx = makeCtx(async () => {
      calls++;
      return calls === 1 ? { text: "not json" } : { text: JSON.stringify(sampleL1) };
    });
    const events = await collect(level1Step.run(new FormData(), ctx));
    const done = events.find((e) => e.type === "stage-done");
    expect(done).toBeDefined();
    expect(calls).toBe(2);
  });

  it("emits error and logs internal detail when both retries fail", async () => {
    const ctx = makeCtx(async () => ({ text: "still not json" }));
    const events = await collect(level1Step.run(new FormData(), ctx));
    const err = events.find((e) => e.type === "error");
    expect(err.message).toBe("AI Level 1 fact extraction failed");
    expect(err.message).not.toContain("JSON");
    expect(ctx.log).toHaveBeenCalled();
  });

  it("emits error if provider rejects (network failure)", async () => {
    const ctx = makeCtx(async () => { throw new Error("upstream-credential-leak-info"); });
    const events = await collect(level1Step.run(new FormData(), ctx));
    const err = events.find((e) => e.type === "error");
    expect(err.message).toBe("AI Level 1 fact extraction failed");
    expect(err.message).not.toContain("upstream-credential");
  });
});
