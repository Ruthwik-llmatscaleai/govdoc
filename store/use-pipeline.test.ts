import { describe, it, expect, beforeEach } from "vitest";
import { usePipelineStore } from "./use-pipeline";
import type { StepEvent } from "@/lib/usecases/types";

beforeEach(() => usePipelineStore.getState().reset());

describe("usePipelineStore", () => {
  it("starts idle", () => {
    expect(usePipelineStore.getState().current).toBeNull();
  });

  it("applies progress event", () => {
    usePipelineStore.setState({ current: { runId: "r1", useCaseId: "x", status: "running", stages: {} } });
    usePipelineStore.getState().applyEvent({ type: "progress", stage: "s1", pct: 10, message: "go" } as StepEvent);
    const s1 = usePipelineStore.getState().current!.stages["s1"]!;
    expect(s1.pct).toBe(10);
    expect(s1.status).toBe("running");
  });

  it("applies stage-done event", () => {
    usePipelineStore.setState({ current: { runId: "r1", useCaseId: "x", status: "running", stages: {} } });
    usePipelineStore.getState().applyEvent({ type: "stage-done", stage: "s1", data: { ok: 1 } } as StepEvent);
    expect(usePipelineStore.getState().current!.stages["s1"]!.status).toBe("done");
  });

  it("applies done event", () => {
    usePipelineStore.setState({ current: { runId: "r1", useCaseId: "x", status: "running", stages: {} } });
    usePipelineStore.getState().applyEvent({ type: "done", result: { final: true } } as StepEvent);
    expect(usePipelineStore.getState().current!.status).toBe("done");
    expect(usePipelineStore.getState().current!.result).toEqual({ final: true });
  });

  it("applies error event", () => {
    usePipelineStore.setState({ current: { runId: "r1", useCaseId: "x", status: "running", stages: {} } });
    usePipelineStore.getState().applyEvent({ type: "error", stage: "s1", message: "boom" } as StepEvent);
    expect(usePipelineStore.getState().current!.status).toBe("error");
  });
});
