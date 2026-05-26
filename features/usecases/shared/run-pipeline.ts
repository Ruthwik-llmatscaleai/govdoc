import { getUseCase } from "@/features/usecases/registry";
import { getDefaultRubricId, loadRubric } from "@/features/rubrics/store";
import { makeLlmRouter } from "@/lib/llm/router";
import type { StepContext, StepEvent } from "@/features/usecases/types";
import { EMPTY_PRECEDENTS } from "@/features/usecases/cucp-reevals/memory/precedents";
import { logger } from "@/lib/logger";

function projectIdFromFilename(filename: string): string {
  const stem = filename.replace(/\.[^./\\]+$/, "");
  const cleaned = stem
    .replace(/[\\/]/g, "_")
    .replace(/\.{2,}/g, "_")
    .replace(/\0/g, "")
    .trim();
  return cleaned || "";
}

export async function* runPipeline(opts: {
  useCaseId: string;
  formData: FormData;
  session: { user: string };
  abortSignal: AbortSignal;
}): AsyncGenerator<StepEvent> {
  const { useCaseId, formData, session, abortSignal } = opts;

  const useCase = getUseCase(useCaseId);
  if (!useCase) {
    yield { type: "error", stage: "init", message: "Unknown use case" };
    return;
  }

  const rubricIdField = formData.get("rubricId");
  const rubricVersionField = formData.get("rubricVersionId");
  const submittedRubricId =
    typeof rubricIdField === "string" && rubricIdField.length > 0 ? rubricIdField : undefined;
  const submittedRubricVersion =
    typeof rubricVersionField === "string" && rubricVersionField.length > 0
      ? rubricVersionField
      : undefined;
  const resolvedRubricId = submittedRubricId ?? (await getDefaultRubricId(useCaseId));
  const rubricContent = await loadRubric(useCaseId, resolvedRubricId, submittedRubricVersion);

  const projectIdRaw = formData.get("projectId");
  const submittedProjectId = typeof projectIdRaw === "string" ? projectIdRaw.trim() : "";
  let derivedProjectId = "";
  if (useCaseId === "cucp-reevals" && !submittedProjectId) {
    const narrative = formData.get("narrative");
    if (narrative instanceof File && narrative.name) {
      derivedProjectId = projectIdFromFilename(narrative.name);
    }
    if (!derivedProjectId) {
      yield { type: "error", stage: "init", message: "Narrative file is required" };
      return;
    }
  } else if (useCaseId === "cmgc-pde" && !submittedProjectId) {
    const factSheets = formData.getAll("factSheet").filter((v): v is File => v instanceof File);
    const first = factSheets[0];
    if (first?.name) derivedProjectId = projectIdFromFilename(first.name);
  }
  const effectiveProjectId = submittedProjectId || derivedProjectId || "_default";
  const runId = crypto.randomUUID();

  const ctx: StepContext = {
    userId: session.user,
    projectId: effectiveProjectId,
    runId,
    prior: {},
    staged: {
      level_1_precedents: [...EMPTY_PRECEDENTS.level_1_precedents],
      level_2_precedents: [...EMPTY_PRECEDENTS.level_2_precedents],
      level_3_precedents: [...EMPTY_PRECEDENTS.level_3_precedents],
      l1_field_overrides: {},
      l1_action_log: [],
    },
    llm: makeLlmRouter(),
    abortSignal,
    log: (msg, data) => logger.warn({ runId, projectId: effectiveProjectId, data }, msg),
    rubricId: resolvedRubricId,
    rubricVersionId: submittedRubricVersion,
    rubric: rubricContent,
  };

  yield { type: "run-started", runId, projectId: effectiveProjectId } satisfies StepEvent;
  yield { type: "progress", stage: "init", pct: 0, message: `Starting ${useCase.label}` } satisfies StepEvent;

  let stepFailed = false;
  for (const step of useCase.pipeline) {
    try {
      for await (const ev of step.run(formData, ctx)) {
        yield ev;
        if (ev.type === "stage-done") ctx.prior[step.id] = ev.data;
        if (ev.type === "error") stepFailed = true;
      }
    } catch (e) {
      const internal = e instanceof Error ? e.message : String(e);
      logger.error({ runId, stage: step.id, error: internal }, "step failed");
      yield { type: "error", stage: step.id, message: "Step failed — check server logs" };
      return;
    }
    if (stepFailed) return;
    if (abortSignal.aborted) return;
  }

  const stageKeys = Object.keys(ctx.prior);
  const stageShape = Object.fromEntries(
    stageKeys.map((k) => [
      k,
      ctx.prior[k] && typeof ctx.prior[k] === "object"
        ? Object.keys(ctx.prior[k] as Record<string, unknown>)
        : typeof ctx.prior[k],
    ]),
  );
  logger.info({ runId, useCaseId, stageKeys, stageShape }, "pipeline done");
  yield { type: "done", result: ctx.prior };
}
