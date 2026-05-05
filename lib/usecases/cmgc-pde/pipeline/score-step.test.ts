import { describe, it, expect, vi } from "vitest";
import { scoreStep } from "./score-step";
import type { StepContext, StepEvent } from "@/lib/usecases/types";
import type { LlmRouter } from "@/lib/llm/types";
import { mockRatings } from "../scoring/fixtures";

function makeCtx(call: LlmRouter["call"], formData: FormData): { ctx: StepContext; formData: FormData } {
  return {
    formData,
    ctx: {
      userId: "test", runId: "r1",
      prior: { evaluate: { ratings: mockRatings({ A1: "C", A2: "C", A3: "C" }) } },
      llm: { call },
      abortSignal: new AbortController().signal,
      log: () => {},
    },
  };
}

async function collect<T>(iter: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const x of iter) out.push(x);
  return out;
}

describe("scoreStep", () => {
  it("emits stage-done with recommendation + multi_method", async () => {
    const fd = new FormData();
    fd.append("provider", "openai");
    const call = vi.fn(async () => ({ text: "two-sentence explanation here." }));
    const { ctx } = makeCtx(call, fd);
    const events = await collect(scoreStep.run(fd, ctx)) as StepEvent[];
    const stageDone = events.find((e) => e.type === "stage-done")!;
    const data = (stageDone as Extract<StepEvent, { type: "stage-done" }>).data as {
      recommendation: { recommended_method: string };
      multi_method: { method_scores: { key_factors_reasoning?: string }[] };
    };
    expect(data.recommendation.recommended_method).toBeTruthy();
    expect(data.multi_method.method_scores).toHaveLength(6);
  });

  it("openai provider gets key_factors_reasoning from LLM", async () => {
    const fd = new FormData();
    fd.append("provider", "openai");
    const call = vi.fn(async () => ({ text: "two-sentence explanation here." }));
    const { ctx } = makeCtx(call, fd);
    const events = await collect(scoreStep.run(fd, ctx)) as StepEvent[];
    const stageDone = events.find((e) => e.type === "stage-done")!;
    const data = (stageDone as Extract<StepEvent, { type: "stage-done" }>).data as {
      multi_method: { method_scores: { key_factors_reasoning?: string }[] };
    };
    const top = data.multi_method.method_scores[0]!;
    expect(top.key_factors_reasoning).toBe("two-sentence explanation here.");
  });

  it("anthropic provider skips the key-factors LLM call", async () => {
    const fd = new FormData();
    fd.append("provider", "anthropic");
    const call = vi.fn(async () => ({ text: "should not be called" }));
    const { ctx } = makeCtx(call, fd);
    await collect(scoreStep.run(fd, ctx));
    expect(call).not.toHaveBeenCalled();
  });

  it("LLM failure on key-factors → reasoning becomes '' (graceful)", async () => {
    const fd = new FormData();
    fd.append("provider", "openai");
    const call = vi.fn(async () => { throw new Error("rate limit"); });
    const { ctx } = makeCtx(call, fd);
    const events = await collect(scoreStep.run(fd, ctx)) as StepEvent[];
    const stageDone = events.find((e) => e.type === "stage-done")!;
    const data = (stageDone as Extract<StepEvent, { type: "stage-done" }>).data as {
      multi_method: { method_scores: { key_factors_reasoning?: string }[] };
    };
    expect(data.multi_method.method_scores[0]!.key_factors_reasoning).toBe("");
  });

  it("emits error when ratings missing", async () => {
    const fd = new FormData();
    const ctx: StepContext = {
      userId: "test", runId: "r1", prior: {},
      llm: { call: vi.fn() },
      abortSignal: new AbortController().signal,
      log: () => {},
    };
    const events = await collect(scoreStep.run(fd, ctx)) as StepEvent[];
    expect(events.at(-1)).toMatchObject({ type: "error", stage: "score" });
  });
});
