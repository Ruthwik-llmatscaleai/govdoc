import { promises as fsp, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const KNOWN_IDS = new Set(["cmgc-pde", "cucp-reevals", "row-appraisal"]);

export type RubricsManifestEntry = {
  id: string;
  label: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type RubricsManifest = {
  rubrics: RubricsManifestEntry[];
};

let storeRoot: string | null = null;

function rootDir(): string {
  return storeRoot ?? join(process.cwd(), "data", "rubrics");
}

export function __setRubricsStoreRootForTests(root: string | null): void {
  storeRoot = root;
}

function assertKnownUsecase(usecaseId: string): void {
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

// Rubric IDs are user-supplied (when creating a new rubric) so they need
// the same path-traversal guard as the use-case ids. Allowed shape: short
// kebab/underscore slug.
function assertSafeRubricId(rubricId: string): void {
  if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(rubricId)) {
    throw new Error(`Invalid rubric id: ${JSON.stringify(rubricId)}`);
  }
}

function usecaseDir(usecaseId: string): string {
  assertKnownUsecase(usecaseId);
  return join(rootDir(), usecaseId);
}

function manifestFile(usecaseId: string): string {
  return join(usecaseDir(usecaseId), "manifest.json");
}

function rubricFile(usecaseId: string, rubricId: string): string {
  assertSafeRubricId(rubricId);
  return join(usecaseDir(usecaseId), `${rubricId}.json`);
}

function legacySingleFile(usecaseId: string): string {
  assertKnownUsecase(usecaseId);
  return join(rootDir(), `${usecaseId}.json`);
}

function ensureUsecaseDir(usecaseId: string): void {
  const dir = usecaseDir(usecaseId);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function nowIso(): string {
  return new Date().toISOString();
}

function defaultManifest(): RubricsManifest {
  return {
    rubrics: [
      {
        id: "default",
        label: "Default",
        isDefault: true,
        createdAt: nowIso(),
      },
    ],
  };
}

async function readManifest(usecaseId: string): Promise<RubricsManifest | null> {
  try {
    const text = await fsp.readFile(manifestFile(usecaseId), "utf-8");
    const parsed = JSON.parse(text);
    if (!parsed || !Array.isArray(parsed.rubrics)) return null;
    return parsed as RubricsManifest;
  } catch {
    return null;
  }
}

async function writeManifest(
  usecaseId: string,
  manifest: RubricsManifest,
): Promise<void> {
  ensureUsecaseDir(usecaseId);
  await fsp.writeFile(
    manifestFile(usecaseId),
    JSON.stringify(manifest, null, 2),
    "utf-8",
  );
}

// One-way migration from the legacy single-file layout
// (`data/rubrics/<usecase>.json`) to the per-rubric directory layout
// (`data/rubrics/<usecase>/default.json` + `manifest.json`). Idempotent: if
// the new directory already has a manifest, this is a no-op.
async function migrateLegacyIfNeeded(usecaseId: string): Promise<void> {
  if (existsSync(manifestFile(usecaseId))) return;
  const legacy = legacySingleFile(usecaseId);
  ensureUsecaseDir(usecaseId);
  if (existsSync(legacy)) {
    const text = await fsp.readFile(legacy, "utf-8");
    await fsp.writeFile(rubricFile(usecaseId, "default"), text, "utf-8");
    await fsp.unlink(legacy);
  }
  await writeManifest(usecaseId, defaultManifest());
}

async function ensureManifest(usecaseId: string): Promise<RubricsManifest> {
  await migrateLegacyIfNeeded(usecaseId);
  const m = await readManifest(usecaseId);
  if (m && m.rubrics.length > 0) return m;
  const fresh = defaultManifest();
  await writeManifest(usecaseId, fresh);
  return fresh;
}

export async function listRubrics(usecaseId: string): Promise<RubricsManifestEntry[]> {
  const m = await ensureManifest(usecaseId);
  return m.rubrics;
}

function findDefault(manifest: RubricsManifest): RubricsManifestEntry {
  const def = manifest.rubrics.find((r) => r.isDefault) ?? manifest.rubrics[0];
  if (!def) {
    throw new Error("Manifest has no rubrics — should be unreachable");
  }
  return def;
}

export async function getDefaultRubricId(usecaseId: string): Promise<string> {
  const m = await ensureManifest(usecaseId);
  return findDefault(m).id;
}

export async function loadRubric(
  usecaseId: string,
  rubricId?: string,
): Promise<unknown | null> {
  const m = await ensureManifest(usecaseId);
  const id = rubricId ?? findDefault(m).id;
  if (!m.rubrics.some((r) => r.id === id)) return null;
  try {
    const text = await fsp.readFile(rubricFile(usecaseId, id), "utf-8");
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function saveRubric(
  usecaseId: string,
  rubricId: string,
  data: unknown,
): Promise<void> {
  const m = await ensureManifest(usecaseId);
  if (!m.rubrics.some((r) => r.id === rubricId)) {
    throw new Error(`Unknown rubric id: ${rubricId}`);
  }
  ensureUsecaseDir(usecaseId);
  await fsp.writeFile(
    rubricFile(usecaseId, rubricId),
    JSON.stringify(data, null, 2),
    "utf-8",
  );
  const next: RubricsManifest = {
    rubrics: m.rubrics.map((r) =>
      r.id === rubricId ? { ...r, updatedAt: nowIso() } : r,
    ),
  };
  await writeManifest(usecaseId, next);
}

// Resets a single rubric back to bundled defaults by removing its data file.
// The manifest entry stays — readers fall through to the bundled default when
// loadRubric returns null for that id.
export async function resetRubricContent(
  usecaseId: string,
  rubricId: string,
): Promise<void> {
  const m = await ensureManifest(usecaseId);
  if (!m.rubrics.some((r) => r.id === rubricId)) {
    throw new Error(`Unknown rubric id: ${rubricId}`);
  }
  const f = rubricFile(usecaseId, rubricId);
  if (existsSync(f)) await fsp.unlink(f);
}

export async function createRubric(
  usecaseId: string,
  args: { id: string; label: string; cloneFrom?: string },
): Promise<RubricsManifestEntry> {
  assertSafeRubricId(args.id);
  const m = await ensureManifest(usecaseId);
  if (m.rubrics.some((r) => r.id === args.id)) {
    throw new Error(`Rubric id already exists: ${args.id}`);
  }
  ensureUsecaseDir(usecaseId);
  if (args.cloneFrom) {
    const cloneFromExists = m.rubrics.some((r) => r.id === args.cloneFrom);
    if (!cloneFromExists) {
      throw new Error(`cloneFrom rubric not found: ${args.cloneFrom}`);
    }
    const srcContent = await loadRubric(usecaseId, args.cloneFrom);
    if (srcContent !== null) {
      await fsp.writeFile(
        rubricFile(usecaseId, args.id),
        JSON.stringify(srcContent, null, 2),
        "utf-8",
      );
    }
  }
  const entry: RubricsManifestEntry = {
    id: args.id,
    label: args.label,
    isDefault: false,
    createdAt: nowIso(),
  };
  await writeManifest(usecaseId, { rubrics: [...m.rubrics, entry] });
  return entry;
}

export async function setDefaultRubric(
  usecaseId: string,
  rubricId: string,
): Promise<void> {
  const m = await ensureManifest(usecaseId);
  if (!m.rubrics.some((r) => r.id === rubricId)) {
    throw new Error(`Unknown rubric id: ${rubricId}`);
  }
  const next: RubricsManifest = {
    rubrics: m.rubrics.map((r) => ({ ...r, isDefault: r.id === rubricId })),
  };
  await writeManifest(usecaseId, next);
}

export async function deleteRubric(
  usecaseId: string,
  rubricId: string,
): Promise<void> {
  const m = await ensureManifest(usecaseId);
  const entry = m.rubrics.find((r) => r.id === rubricId);
  if (!entry) throw new Error(`Unknown rubric id: ${rubricId}`);
  if (entry.isDefault) {
    throw new Error("Cannot delete the default rubric. Promote another rubric first.");
  }
  const f = rubricFile(usecaseId, rubricId);
  if (existsSync(f)) await fsp.unlink(f);
  await writeManifest(usecaseId, {
    rubrics: m.rubrics.filter((r) => r.id !== rubricId),
  });
}
