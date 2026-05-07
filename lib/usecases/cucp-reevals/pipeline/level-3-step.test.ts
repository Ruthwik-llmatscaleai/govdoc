import { describe, it, expect, vi, afterEach } from "vitest";
import { level3Step } from "./level-3-step";
import { resolveHumanResponse, __clearRendezvous } from "@/lib/runs/needs-input-rendezvous";
import type { StepContext } from "@/lib/usecases/types";

const sampleL3 = {
  criteria: [{ s_no: 1, category: "x", qualification: "y", rule_requires: "r", evidence_summary: "e", reasoning: "rsn", pass_fail: "Pass", request_info: "No", confidence: 9 }],
  final_decision: "Yes",
  certifier_comments: "ok",
};

afterEach(() => __clearRendezvous());

function makeCtx(runId: string): StepContext {
  return {
    userId: "u", runId,
    prior: {
      level1: { firm_name: "F", cross_reference_result: "100000", narrative_pnw: "NOT PROVIDED", extracted_facts: [] },
      level2: { classifications: [] },
    },
    llm: { call: vi.fn(async () => ({ text: JSON.stringify(sampleL3) })) } as any,
    abortSignal: new AbortController().signal, log: vi.fn(),
  };
}

async function collect<T>(iter: AsyncIterable<T>) { const out: T[] = []; for await (const ev of iter) out.push(ev); return out; }

describe("level3Step", () => {
  it("emits stage-done(level3) → needs-input, awaits rendezvous, stores overrides", async () => {
    const runId = "test-run-1";
    const ctx = makeCtx(runId);
    const events: any[] = [];
    const done = (async () => { for await (const ev of level3Step.run(new FormData(), ctx)) events.push(ev); })();
    await new Promise((r) => setTimeout(r, 50));
    expect(resolveHumanResponse(runId, { overrides: [{ s_no: 1, field: "pass_fail", value: "Fail", reasoning: "x" }] })).toBe(true);
    await done;

    const types = events.map((e) => e.type);
    expect(types).toContain("stage-done");
    expect(types).toContain("needs-input");
    expect(types.indexOf("stage-done")).toBeLessThan(types.indexOf("needs-input"));

    const ni: any = events.find((e: any) => e.type === "needs-input");
    expect(ni.prompt.kind).toBe("approve-or-override");
    expect(ni.prompt.category).toBe("level-3-criteria");
    expect(ni.prompt.proposed.decision).toBe("Yes");

    expect(ctx.prior.overrides).toEqual([{ s_no: 1, field: "pass_fail", value: "Fail", reasoning: "x" }]);
  });

  it("treats missing overrides as empty array", async () => {
    const runId = "test-run-2";
    const ctx = makeCtx(runId);
    const done = (async () => { for await (const _ev of level3Step.run(new FormData(), ctx)) { void _ev; } })();
    await new Promise((r) => setTimeout(r, 50));
    resolveHumanResponse(runId, {});
    await done;
    expect(ctx.prior.overrides).toEqual([]);
  });

  it("emits sanitized error when provider rejects", async () => {
    const runId = "test-run-3";
    const ctx = makeCtx(runId);
    (ctx.llm as any).call = vi.fn(async () => { throw new Error("creds-leak"); });
    const events = await collect(level3Step.run(new FormData(), ctx));
    const err: any = events.find((e: any) => e.type === "error");
    expect(err.message).toBe("AI Level 3 threshold evaluation failed");
  });
});
