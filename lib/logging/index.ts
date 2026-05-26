export { withCorrelation, getCorrelationId } from "./context";
export { redact } from "./redact";
export type { Logger, LoggerOptions, LogEntry, LogLevel } from "./types";

import { LOG_LEVEL_NUMBERS } from "./types";
import type { Logger, LoggerOptions, LogEntry } from "./types";
import { getCorrelationId } from "./context";
import { redact } from "./redact";

/**
 * Create a structured JSON logger.
 * Outputs single-line JSON to stdout/stderr, one event per line.
 */
export function createLogger(options: LoggerOptions = {}): Logger {
  const service = options.service ?? "govdoc";

  function emit(
    level: "info" | "warn" | "error",
    msg: string,
    data?: Record<string, unknown>,
  ): void {
    const correlationId =
      options.correlationId ?? getCorrelationId();

    const entry: LogEntry = {
      level: LOG_LEVEL_NUMBERS[level],
      time: new Date().toISOString(),
      service,
      ...(correlationId && { correlationId }),
      ...(options.useCase && { useCase: options.useCase }),
      msg,
      ...(data && redact(data)),
    };

    const line = JSON.stringify(entry);

    if (level === "error") {
      console.error(line);
    } else if (level === "warn") {
      console.warn(line);
    } else {
      console.log(line);
    }
  }

  return {
    info: (msg, data) => emit("info", msg, data),
    warn: (msg, data) => emit("warn", msg, data),
    error: (msg, data) => emit("error", msg, data),
  };
}
