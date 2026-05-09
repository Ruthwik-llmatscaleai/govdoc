import { promises as fsp, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const KNOWN_IDS = new Set(["cmgc-pde", "cucp-reevals", "row-appraisal"]);

let storeRoot: string | null = null;

function rootDir(): string {
  return storeRoot ?? join(process.cwd(), "data", "rubrics");
}

export function __setRubricStoreRootForTests(root: string | null): void {
  storeRoot = root;
}

function assertKnownId(usecaseId: string): void {
  if (!KNOWN_IDS.has(usecaseId)) {
    throw new Error(`Unknown rubric use case: ${usecaseId}`);
  }
  if (
    usecaseId.includes("/") ||
    usecaseId.includes("\\") ||
    usecaseId.includes("..") ||
    usecaseId.includes("\0")
  ) {
    throw new Error(`Invalid use case id: ${JSON.stringify(usecaseId)}`);
  }
}

function fileFor(usecaseId: string): string {
  assertKnownId(usecaseId);
  return join(rootDir(), `${usecaseId}.json`);
}

function ensureDir(): void {
  if (!existsSync(rootDir())) mkdirSync(rootDir(), { recursive: true });
}

export async function loadSavedRubric(usecaseId: string): Promise<unknown | null> {
  try {
    const file = fileFor(usecaseId);
    if (!existsSync(file)) return null;
    const text = await fsp.readFile(file, "utf-8");
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function saveRubric(usecaseId: string, data: unknown): Promise<void> {
  ensureDir();
  await fsp.writeFile(fileFor(usecaseId), JSON.stringify(data, null, 2), "utf-8");
}

export async function deleteRubric(usecaseId: string): Promise<void> {
  const file = fileFor(usecaseId);
  if (existsSync(file)) await fsp.unlink(file);
}
