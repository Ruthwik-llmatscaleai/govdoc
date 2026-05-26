import { AsyncLocalStorage } from "node:async_hooks";

interface CorrelationContext {
  correlationId: string;
}

const storage = new AsyncLocalStorage<CorrelationContext>();

/**
 * Run `fn` within an async context that carries the given correlation ID.
 */
export function withCorrelation<T>(id: string, fn: () => T): T {
  return storage.run({ correlationId: id }, fn);
}

/**
 * Retrieve the current correlation ID from AsyncLocalStorage, if any.
 */
export function getCorrelationId(): string | undefined {
  return storage.getStore()?.correlationId;
}
