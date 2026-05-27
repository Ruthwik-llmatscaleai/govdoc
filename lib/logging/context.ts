import { AsyncLocalStorage } from "node:async_hooks";

interface CorrelationContext {
  correlationId: string;
}

const storage = new AsyncLocalStorage<CorrelationContext>();

export function withCorrelation<T>(id: string, fn: () => T): T {
  return storage.run({ correlationId: id }, fn);
}

export function getCorrelationId(): string | undefined {
  return storage.getStore()?.correlationId;
}
