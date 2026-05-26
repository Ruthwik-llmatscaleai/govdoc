import { describe, it, expect, vi } from "vitest";
import type { Logger } from "@/lib/logging/types";
import type { LlmResponse } from "./types";
import { callLlm } from "./client";

vi.mock("./router", () => ({
  makeLlmRouter: vi.fn(),
}));

import { makeLlmRouter } from "./router";

const mockMakeLlmRouter = vi.mocked(makeLlmRouter);

function makeLogger() {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as unknown as Logger & {
    info: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };
}

describe("callLlm", () => {
  it("logs start and complete, and returns the response", async () => {
    const canned: LlmResponse = {
      text: "Hello!",
      usage: { promptTokens: 10, completionTokens: 5 },
    };
    mockMakeLlmRouter.mockReturnValue({ call: vi.fn().mockResolvedValue(canned) });
    const logger = makeLogger();

    const result = await callLlm({
      provider: "openai",
      model: "gpt-4o",
      messages: [{ role: "user", content: "Hi" }],
      logger,
    });

    expect(result).toBe(canned);
    expect(logger.info).toHaveBeenCalledWith("llm.call.start", {
      model: "gpt-4o",
      provider: "openai",
    });
    expect(logger.info).toHaveBeenCalledWith(
      "llm.call.complete",
      expect.objectContaining({
        model: "gpt-4o",
        tokens: { promptTokens: 10, completionTokens: 5 },
        durationMs: expect.any(Number),
      }),
    );
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("logs error and rethrows on failure", async () => {
    const err = new Error("API timeout");
    mockMakeLlmRouter.mockReturnValue({ call: vi.fn().mockRejectedValue(err) });
    const logger = makeLogger();

    await expect(
      callLlm({
        provider: "anthropic",
        model: "claude-sonnet-4-20250514",
        messages: [{ role: "user", content: "Hi" }],
        logger,
      }),
    ).rejects.toThrow("API timeout");

    expect(logger.error).toHaveBeenCalledWith("llm.call.failed", {
      model: "claude-sonnet-4-20250514",
      err,
    });
    expect(logger.info).toHaveBeenCalledWith("llm.call.start", {
      model: "claude-sonnet-4-20250514",
      provider: "anthropic",
    });
    // complete should NOT be called on failure
    expect(logger.info).not.toHaveBeenCalledWith(
      "llm.call.complete",
      expect.anything(),
    );
  });
});
