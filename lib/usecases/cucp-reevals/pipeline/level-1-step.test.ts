import { describe, it, expect, vi } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { level1Step } from "./level-1-step";
import type { StepContext } from "@/lib/usecases/types";
import { __setStoreRootForTests } from "@/lib/usecases/cucp-reevals/memory/store";

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

  it("includes per-project L1 precedents in the system prompt", async () => {
    const root = mkdtempSync(join(tmpdir(), "l1-precedents-"));
    __setStoreRootForTests(root);
    writeFileSync(
      join(root, "proj-x.json"),
      JSON.stringify({
        level_1_precedents: [
          { target: "Some target", correction: "Some correction", human_reasoning: "rationale" },
        ],
        level_2_precedents: [],
        level_3_precedents: [],
      }),
    );

    const llmCall = vi.fn(async () => ({ text: JSON.stringify(sampleL1) }));
    const ctx: StepContext = {
      userId: "u", projectId: "proj-x", runId: "r",
      prior: { extract: { narrativeText: "body", firmRevenues: {} } },
      staged: { level_1_precedents: [], level_2_precedents: [], level_3_precedents: [] },
      llm: { call: llmCall } as any,
      abortSignal: new AbortController().signal, log: vi.fn(),
    };

    await collect(level1Step.run(new FormData(), ctx));

    expect(llmCall).toHaveBeenCalledTimes(1);
    const calls = llmCall.mock.calls as any[];
    const sys = calls[0][0].messages[0].content;
    expect(sys).toContain("INSTITUTIONAL MEMORY - LEVEL 1 HUMAN CORRECTIONS:");
    expect(sys).toContain("If you see 'Some target', apply correction: 'Some correction'");

    __setStoreRootForTests(null);
    rmSync(root, { recursive: true, force: true });
  });
});
