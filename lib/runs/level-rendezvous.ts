type Waiter = { resolve: (v: unknown) => void; reject: (e: unknown) => void; createdAt: number };
const TTL_MS = 30 * 60 * 1000;

const map = new Map<string, Waiter>();

function key(runId: string, level: number): string {
  return `${runId}::L${level}`;
}

function reapStale(): void {
  const now = Date.now();
  for (const [k, v] of map.entries()) {
    if (now - v.createdAt > TTL_MS) {
      v.reject(new Error("Level decision timed out"));
      map.delete(k);
    }
  }
}

export function awaitLevelDecision<T = unknown>(runId: string, level: number): Promise<T> {
  reapStale();
  const k = key(runId, level);
  let resolve!: (v: unknown) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<unknown>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  map.set(k, { resolve, reject, createdAt: Date.now() });
  return promise as Promise<T>;
}

export function cancelRun(runId: string): void {
  for (const [k, v] of map.entries()) {
    if (k.startsWith(`${runId}::`)) {
      v.reject(new Error("Run cancelled"));
      map.delete(k);
    }
  }
}

export function resolveLevelDecision(runId: string, level: number, payload: unknown): boolean {
  const k = key(runId, level);
  const w = map.get(k);
  if (!w) return false;
  map.delete(k);
  w.resolve(payload);
  return true;
}

export function __clearLevelRendezvous(): void {
  map.clear();
}
