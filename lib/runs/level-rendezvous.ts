type Waiter = { resolve: (v: unknown) => void; reject: (e: Error) => void; createdAt: number; timer: ReturnType<typeof setTimeout> };
const TTL_MS = 10 * 60 * 1000; // 10 minutes max wait

const map = new Map<string, Waiter>();

function key(runId: string, level: number): string {
  return `${runId}::L${level}`;
}

function reapStale(): void {
  const now = Date.now();
  for (const [k, v] of map.entries()) {
    if (now - v.createdAt > TTL_MS) {
      clearTimeout(v.timer);
      v.reject(new Error("Level decision timed out — please re-run the evaluation."));
      map.delete(k);
    }
  }
}

export function awaitLevelDecision<T = unknown>(runId: string, level: number): Promise<T> {
  reapStale();
  const k = key(runId, level);
  // Clear any existing waiter for this key
  const existing = map.get(k);
  if (existing) {
    clearTimeout(existing.timer);
    map.delete(k);
  }

  let resolve!: (v: unknown) => void;
  let reject!: (e: Error) => void;
  const promise = new Promise<unknown>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  const timer = setTimeout(() => {
    map.delete(k);
    reject(new Error("Level decision timed out (10 min) — please re-run the evaluation."));
  }, TTL_MS);
  map.set(k, { resolve, reject, createdAt: Date.now(), timer });
  return promise as Promise<T>;
}

export function resolveLevelDecision(runId: string, level: number, payload: unknown): boolean {
  const k = key(runId, level);
  const w = map.get(k);
  if (!w) return false;
  clearTimeout(w.timer);
  map.delete(k);
  w.resolve(payload);
  return true;
}

export function __clearLevelRendezvous(): void {
  for (const w of map.values()) {
    clearTimeout(w.timer);
  }
  map.clear();
}
