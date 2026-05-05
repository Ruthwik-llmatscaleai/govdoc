import { describe, it, expect, vi } from "vitest";
import { validateStep } from "./validate-step";
import type { StepContext, StepEvent } from "@/lib/usecases/types";
import { mockRatings } from "../scoring/fixtures";

function makeCtx(): StepContext {
  return {
    userId: "test", runId: "r1",
    prior: { evaluate: { ratings: mockRatings() } },
    llm: { call: vi.fn() },
    abortSignal: new AbortController().signal,
    log: () => {},
  };
}

async function collect<T>(iter: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const x of iter) out.push(x);
  return out;
}

describe("validateStep", () => {
  it("returns stage-done with data null when no districtRatings", async () => {
    const fd = new FormData();
    const events = await collect(validateStep.run(fd, makeCtx())) as StepEvent[];
    const stageDone = events.find((e) => e.type === "stage-done")!;
    expect((stageDone as Extract<StepEvent, { type: "stage-done" }>).data).toBeNull();
  });

  it("returns stage-done with ValidationResult when districtRatings present", async () => {
    const fd = new FormData();
    const districtRatings: Record<string, "A"|"B"|"C"> = { A1: "B", A2: "B", F3: "B" };
    fd.append("districtRatings", JSON.stringify(districtRatings));
    const events = await collect(validateStep.run(fd, makeCtx())) as StepEvent[];
    const stageDone = events.find((e) => e.type === "stage-done")!;
    const data = (stageDone as Extract<StepEvent, { type: "stage-done" }>).data as { summary: { total_compared: number } };
    expect(data.summary.total_compared).toBe(25);
  });

  it("yields error on invalid districtRatings JSON", async () => {
    const fd = new FormData();
    fd.append("districtRatings", "{not json");
    const events = await collect(validateStep.run(fd, makeCtx())) as StepEvent[];
    expect(events.at(-1)).toMatchObject({ type: "error", stage: "validate" });
  });
});
