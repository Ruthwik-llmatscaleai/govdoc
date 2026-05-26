import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createLogger, withCorrelation, getCorrelationId } from "./index";

describe("createLogger", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("outputs single-line JSON with required fields", () => {
    const logger = createLogger({ correlationId: "test-123", useCase: "row-appraisal" });
    logger.info("upload.received", { filename: "doc.pdf", bytes: 1024 });

    expect(console.log).toHaveBeenCalledTimes(1);
    const line = (console.log as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const entry = JSON.parse(line);

    expect(entry.level).toBe(30);
    expect(entry.service).toBe("govdoc");
    expect(entry.correlationId).toBe("test-123");
    expect(entry.useCase).toBe("row-appraisal");
    expect(entry.msg).toBe("upload.received");
    expect(entry.filename).toBe("doc.pdf");
    expect(entry.bytes).toBe(1024);
    expect(entry.time).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("uses console.warn for warn level", () => {
    const logger = createLogger();
    logger.warn("llm.retry", { attempt: 2, reason: "rate_limit" });

    expect(console.warn).toHaveBeenCalledTimes(1);
    const entry = JSON.parse((console.warn as ReturnType<typeof vi.fn>).mock.calls[0][0]);
    expect(entry.level).toBe(40);
    expect(entry.msg).toBe("llm.retry");
  });

  it("uses console.error for error level", () => {
    const logger = createLogger();
    logger.error("pipeline.failed", { stage: "evaluate" });

    expect(console.error).toHaveBeenCalledTimes(1);
    const entry = JSON.parse((console.error as ReturnType<typeof vi.fn>).mock.calls[0][0]);
    expect(entry.level).toBe(50);
    expect(entry.msg).toBe("pipeline.failed");
  });

  it("redacts sensitive data in output", () => {
    const logger = createLogger({ correlationId: "c-1" });
    logger.info("auth.check", { token: "secret-value", user: "alice" });

    const entry = JSON.parse((console.log as ReturnType<typeof vi.fn>).mock.calls[0][0]);
    expect(entry.token).toBe("[REDACTED]");
    expect(entry.user).toBe("alice");
  });

  it("omits correlationId and useCase when not provided", () => {
    const logger = createLogger();
    logger.info("boot");

    const entry = JSON.parse((console.log as ReturnType<typeof vi.fn>).mock.calls[0][0]);
    expect(entry.correlationId).toBeUndefined();
    expect(entry.useCase).toBeUndefined();
  });
});

describe("withCorrelation", () => {
  it("provides correlation ID within async context", () => {
    const result = withCorrelation("corr-456", () => {
      return getCorrelationId();
    });
    expect(result).toBe("corr-456");
  });

  it("correlation ID is undefined outside context", () => {
    expect(getCorrelationId()).toBeUndefined();
  });

  it("logger picks up correlation ID from context", () => {
    vi.spyOn(console, "log").mockImplementation(() => {});

    withCorrelation("ctx-789", () => {
      const logger = createLogger({ useCase: "test" });
      logger.info("inside.context");
    });

    const entry = JSON.parse((console.log as ReturnType<typeof vi.fn>).mock.calls[0][0]);
    expect(entry.correlationId).toBe("ctx-789");

    vi.restoreAllMocks();
  });

  it("explicit correlationId in options takes precedence over context", () => {
    vi.spyOn(console, "log").mockImplementation(() => {});

    withCorrelation("from-context", () => {
      const logger = createLogger({ correlationId: "explicit-id" });
      logger.info("test");
    });

    const entry = JSON.parse((console.log as ReturnType<typeof vi.fn>).mock.calls[0][0]);
    expect(entry.correlationId).toBe("explicit-id");

    vi.restoreAllMocks();
  });
});
