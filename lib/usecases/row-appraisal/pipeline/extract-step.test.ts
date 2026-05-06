import { describe, it, expect, vi } from "vitest";
import { extractStep } from "./extract-step";
import type { StepContext } from "@/lib/usecases/types";

const fakeCtx: StepContext = {
  userId: "u",
  runId: "r",
  prior: {},
  llm: { call: vi.fn() },
  abortSignal: new AbortController().signal,
  log: vi.fn(),
};

async function collect(iter: AsyncIterable<unknown>) {
  const out: unknown[] = [];
  for await (const ev of iter) out.push(ev);
  return out;
}

describe("row-appraisal extractStep", () => {
  it("emits progress then stage-done with correct markdown_asset and non-empty extracted_text", async () => {
    const file = new File(
      [new Uint8Array([1])],
      "Appraisal_EA2F590_Parcel_36668.pdf",
      { type: "application/pdf" },
    );
    const fd = new FormData();
    fd.append("pdf", file);

    const events = await collect(extractStep.run(fd, fakeCtx));

    const progressEvents = events.filter((e: any) => e.type === "progress" && e.stage === "extract");
    expect(progressEvents.length).toBeGreaterThanOrEqual(1);

    const done = events.find((e: any) => e.type === "stage-done") as any;
    expect(done).toBeDefined();
    expect(done.stage).toBe("extract");
    expect(done.data.markdown_asset).toBe("landing_ai_output.md");
    expect(typeof done.data.extracted_text).toBe("string");
    expect(done.data.extracted_text.length).toBeGreaterThan(0);
    expect(done.data.pdf_filename).toBe("Appraisal_EA2F590_Parcel_36668.pdf");

    // Progress must come before stage-done
    const progressIdx = events.findIndex((e: any) => e.type === "progress" && e.stage === "extract");
    const doneIdx = events.findIndex((e: any) => e.type === "stage-done");
    expect(progressIdx).toBeLessThan(doneIdx);
  });

  it("emits error event when loadBundledMarkdownForFilename returns null", async () => {
    const mod = await import("@/lib/usecases/row-appraisal/extract/load-bundled-md");
    const spy = vi
      .spyOn(mod, "loadBundledMarkdownForFilename")
      .mockResolvedValueOnce(null);

    const file = new File([new Uint8Array([1])], "definitely-not-mapped.pdf", {
      type: "application/pdf",
    });
    const fd = new FormData();
    fd.append("pdf", file);

    const events = await collect(extractStep.run(fd, fakeCtx));

    const errorEvent = events.find((e: any) => e.type === "error") as any;
    expect(errorEvent).toBeDefined();
    expect(errorEvent.stage).toBe("extract");
    expect(errorEvent.message).toContain("No bundled Landing AI output");

    spy.mockRestore();
  });

  it("propagates provider and model into stage-done data", async () => {
    const file = new File(
      [new Uint8Array([1])],
      "Appraisal_EA2F590_Parcel_36668.pdf",
      { type: "application/pdf" },
    );
    const fd = new FormData();
    fd.append("pdf", file);
    fd.append("provider", "anthropic");
    fd.append("model", "claude-opus-4-5");

    const events = await collect(extractStep.run(fd, fakeCtx));
    const done = events.find((e: any) => e.type === "stage-done") as any;
    expect(done.data.provider).toBe("anthropic");
    expect(done.data.model).toBe("claude-opus-4-5");
  });

  it("uses default provider openai and model gpt-4.1 when not specified", async () => {
    const file = new File(
      [new Uint8Array([1])],
      "Appraisal_EA2F590_Parcel_36668.pdf",
      { type: "application/pdf" },
    );
    const fd = new FormData();
    fd.append("pdf", file);

    const events = await collect(extractStep.run(fd, fakeCtx));
    const done = events.find((e: any) => e.type === "stage-done") as any;
    expect(done.data.provider).toBe("openai");
    expect(done.data.model).toBe("gpt-4.1");
  });
});
