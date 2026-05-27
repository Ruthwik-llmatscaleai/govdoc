export type LogLevel = "info" | "warn" | "error";

export const LOG_LEVEL_NUMBERS: Record<LogLevel, number> = {
  info: 30,
  warn: 40,
  error: 50,
};

export interface LogEntry {
  level: number;
  time: string;
  service: string;
  correlationId?: string;
  useCase?: string;
  msg: string;
  [key: string]: unknown;
}

export interface LoggerOptions {
  correlationId?: string;
  useCase?: string;
  service?: string;
}

export interface Logger {
  info(msg: string, data?: Record<string, unknown>): void;
  warn(msg: string, data?: Record<string, unknown>): void;
  error(msg: string, data?: Record<string, unknown>): void;
}
