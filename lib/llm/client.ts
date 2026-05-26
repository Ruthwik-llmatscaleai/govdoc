import type { Logger } from "@/lib/logging/types";
import type { LlmCall, LlmResponse } from "./types";
import { makeLlmRouter } from "./router";

export type LlmCallOpts = LlmCall & { logger: Logger };

export async function callLlm(opts: LlmCallOpts): Promise<LlmResponse> {
  const { logger, ...req } = opts;

  logger.info("llm.call.start", { model: req.model, provider: req.provider });
  const start = performance.now();

  try {
    const router = makeLlmRouter();
    const response = await router.call(req);
    const durationMs = Math.round(performance.now() - start);

    logger.info("llm.call.complete", {
      model: req.model,
      tokens: response.usage,
      durationMs,
    });

    return response;
  } catch (err) {
    logger.error("llm.call.failed", { model: req.model, err });
    throw err;
  }
}
