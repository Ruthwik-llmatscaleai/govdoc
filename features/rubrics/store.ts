import prisma from "@/lib/db";
import { computeNextVersionId, type VersionBump } from "./version";

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

export type RubricVersionEntry = {
  id: string;
  createdAt: string;
  source: "edit" | "upload" | "clone" | "restore" | "seed";
  label?: string;
  note?: string;
};

// For tests only
export function __setRubricsStoreRootForTests(_root: string | null): void {
  // no-op — DB-backed store doesn't use a root dir
}

function assertKnownUsecase(usecaseId: string): void {
  if (!KNOWN_IDS.has(usecaseId)) {
    throw new Error(`Unknown rubric use case: ${usecaseId}`);
  }
}

function assertSafeRubricId(rubricId: string): void {
  if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(rubricId)) {
    throw new Error(`Invalid rubric id: ${JSON.stringify(rubricId)}`);
  }
}

function assertSafeVersionId(versionId: string): void {
  if (!/^v(\d+(\.\d+)?|\d{3,})$/.test(versionId)) {
    throw new Error(`Invalid version id: ${JSON.stringify(versionId)}`);
  }
}

async function ensureDefaultRubric(usecaseId: string): Promise<void> {
  const count = await prisma.rubric.count({
    where: { useCaseId: usecaseId, deletedAt: null },
  });
  if (count === 0) {
    await prisma.rubric.create({
      data: {
        useCaseId: usecaseId,
        slug: "default",
        label: "Default",
        isDefault: true,
        content: null,
      },
    });
  }
}

export async function listRubrics(usecaseId: string): Promise<RubricsManifestEntry[]> {
  assertKnownUsecase(usecaseId);
  await ensureDefaultRubric(usecaseId);
  const rows = await prisma.rubric.findMany({
    where: { useCaseId: usecaseId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((r) => ({
    id: r.slug,
    label: r.label,
    isDefault: r.isDefault,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function getDefaultRubricId(usecaseId: string): Promise<string> {
  assertKnownUsecase(usecaseId);
  await ensureDefaultRubric(usecaseId);
  const row = await prisma.rubric.findFirst({
    where: { useCaseId: usecaseId, isDefault: true, deletedAt: null },
  });
  return row?.slug ?? "default";
}

export async function loadRubric(
  usecaseId: string,
  rubricId?: string,
  versionId?: string,
): Promise<unknown | null> {
  assertKnownUsecase(usecaseId);
  await ensureDefaultRubric(usecaseId);
  const slug = rubricId ?? await getDefaultRubricId(usecaseId);

  const rubric = await prisma.rubric.findFirst({
    where: { useCaseId: usecaseId, slug, deletedAt: null },
  });
  if (!rubric) return null;

  if (versionId !== undefined) {
    assertSafeVersionId(versionId);
    const ver = await prisma.rubricVersion.findFirst({
      where: { rubricId: rubric.id, versionId },
    });
    return ver?.content ?? null;
  }

  return rubric.content ?? null;
}

export async function listVersions(
  usecaseId: string,
  rubricId: string,
): Promise<RubricVersionEntry[]> {
  assertKnownUsecase(usecaseId);
  assertSafeRubricId(rubricId);

  const rubric = await prisma.rubric.findFirst({
    where: { useCaseId: usecaseId, slug: rubricId, deletedAt: null },
  });
  if (!rubric) return [];

  const rows = await prisma.rubricVersion.findMany({
    where: { rubricId: rubric.id },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((v) => ({
    id: v.versionId,
    createdAt: v.createdAt.toISOString(),
    source: v.source as RubricVersionEntry["source"],
    ...(v.label ? { label: v.label } : {}),
    ...(v.note ? { note: v.note } : {}),
  }));
}

export async function saveRubric(
  usecaseId: string,
  rubricId: string,
  data: unknown,
  opts: {
    source?: RubricVersionEntry["source"];
    note?: string;
    label?: string;
    mode?: "new" | "overwrite";
    bump?: VersionBump;
    versionId?: string;
  } = {},
): Promise<{ versionId: string }> {
  assertKnownUsecase(usecaseId);
  assertSafeRubricId(rubricId);

  const rubric = await prisma.rubric.findFirst({
    where: { useCaseId: usecaseId, slug: rubricId, deletedAt: null },
  });
  if (!rubric) throw new Error(`Unknown rubric id: ${rubricId}`);

  // Update the live content
  await prisma.rubric.update({
    where: { id: rubric.id },
    data: { content: data as any },
  });

  // Seed: if no versions exist yet, snapshot the prior content as v001
  const existingVersions = await prisma.rubricVersion.findMany({
    where: { rubricId: rubric.id },
    orderBy: { createdAt: "desc" },
  });

  if (existingVersions.length === 0 && rubric.content !== null) {
    await prisma.rubricVersion.create({
      data: {
        rubricId: rubric.id,
        versionId: "v001",
        source: "seed",
        content: rubric.content as any,
      },
    });
  }

  const mode = opts.mode ?? "new";
  let targetId: string;

  if (mode === "overwrite") {
    const versions = await prisma.rubricVersion.findMany({
      where: { rubricId: rubric.id },
      orderBy: { createdAt: "desc" },
    });
    if (versions.length === 0) {
      throw new Error("No version to overwrite — save with mode: 'new' first.");
    }
    const head = versions[0]!;
    targetId = head.versionId;
    await prisma.rubricVersion.update({
      where: { id: head.id },
      data: {
        content: data as any,
        ...(opts.note ? { note: opts.note } : {}),
      },
    });
  } else {
    const versions = await prisma.rubricVersion.findMany({
      where: { rubricId: rubric.id },
      select: { versionId: true },
    });
    const versionList = versions.map((v) => ({ id: v.versionId }));
    targetId = computeNextVersionId(
      versionList,
      opts.bump ?? "minor",
      opts.versionId,
    );

    await prisma.rubricVersion.create({
      data: {
        rubricId: rubric.id,
        versionId: targetId,
        source: opts.source ?? "edit",
        content: data as any,
        ...(opts.label ? { label: opts.label } : {}),
        ...(opts.note ? { note: opts.note } : {}),
      },
    });
  }

  return { versionId: targetId };
}

export async function resetRubricContent(
  usecaseId: string,
  rubricId: string,
): Promise<void> {
  assertKnownUsecase(usecaseId);
  assertSafeRubricId(rubricId);

  const rubric = await prisma.rubric.findFirst({
    where: { useCaseId: usecaseId, slug: rubricId, deletedAt: null },
  });
  if (!rubric) throw new Error(`Unknown rubric id: ${rubricId}`);

  await prisma.rubric.update({
    where: { id: rubric.id },
    data: { content: null },
  });
}

export async function createRubric(
  usecaseId: string,
  args: { id: string; label: string; cloneFrom?: string },
): Promise<RubricsManifestEntry> {
  assertKnownUsecase(usecaseId);
  assertSafeRubricId(args.id);

  const existing = await prisma.rubric.findFirst({
    where: { useCaseId: usecaseId, slug: args.id, deletedAt: null },
  });
  if (existing) throw new Error(`Rubric id already exists: ${args.id}`);

  let clonedContent: unknown = null;
  if (args.cloneFrom) {
    const source = await prisma.rubric.findFirst({
      where: { useCaseId: usecaseId, slug: args.cloneFrom, deletedAt: null },
    });
    if (!source) throw new Error(`cloneFrom rubric not found: ${args.cloneFrom}`);
    clonedContent = source.content;
  }

  const row = await prisma.rubric.create({
    data: {
      useCaseId: usecaseId,
      slug: args.id,
      label: args.label,
      isDefault: false,
      content: clonedContent as any,
    },
  });

  return {
    id: row.slug,
    label: row.label,
    isDefault: row.isDefault,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function setDefaultRubric(
  usecaseId: string,
  rubricId: string,
): Promise<void> {
  assertKnownUsecase(usecaseId);
  assertSafeRubricId(rubricId);

  const rubric = await prisma.rubric.findFirst({
    where: { useCaseId: usecaseId, slug: rubricId, deletedAt: null },
  });
  if (!rubric) throw new Error(`Unknown rubric id: ${rubricId}`);

  // Unset all defaults for this use case, then set the target
  await prisma.rubric.updateMany({
    where: { useCaseId: usecaseId, deletedAt: null },
    data: { isDefault: false },
  });
  await prisma.rubric.update({
    where: { id: rubric.id },
    data: { isDefault: true },
  });
}

export async function deleteVersion(
  usecaseId: string,
  rubricId: string,
  versionId: string,
): Promise<void> {
  assertKnownUsecase(usecaseId);
  assertSafeRubricId(rubricId);
  assertSafeVersionId(versionId);

  const rubric = await prisma.rubric.findFirst({
    where: { useCaseId: usecaseId, slug: rubricId, deletedAt: null },
  });
  if (!rubric) throw new Error(`Unknown rubric id: ${rubricId}`);

  const versions = await prisma.rubricVersion.findMany({
    where: { rubricId: rubric.id },
    orderBy: { createdAt: "desc" },
  });

  const target = versions.find((v) => v.versionId === versionId);
  if (!target) throw new Error(`Unknown version id: ${versionId}`);
  if (versions.length <= 1) throw new Error("Cannot delete the only remaining version");

  const newest = versions[0]!;
  if (newest.versionId === versionId) {
    throw new Error("Cannot delete the newest version. Restore an older version first.");
  }

  await prisma.rubricVersion.delete({ where: { id: target.id } });
}

export async function deleteRubric(
  usecaseId: string,
  rubricId: string,
): Promise<void> {
  assertKnownUsecase(usecaseId);
  assertSafeRubricId(rubricId);

  const rubric = await prisma.rubric.findFirst({
    where: { useCaseId: usecaseId, slug: rubricId, deletedAt: null },
  });
  if (!rubric) throw new Error(`Unknown rubric id: ${rubricId}`);
  if (rubric.isDefault) {
    throw new Error("Cannot delete the default rubric. Promote another rubric first.");
  }

  // Hard delete: remove all versions and the rubric itself
  await prisma.rubricVersion.deleteMany({ where: { rubricId: rubric.id } });
  await prisma.rubric.delete({ where: { id: rubric.id } });
}
