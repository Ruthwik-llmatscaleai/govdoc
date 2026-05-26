export type ParsedVersionId = { major: number; minor: number | null };
export type VersionBump = "minor" | "major";

const NEW_RE = /^v(\d+)(?:\.(\d+))?$/;
const LEGACY_RE = /^v(\d{3,})$/;

export function parseVersionId(id: string): ParsedVersionId | null {
  // Legacy match (e.g. "v001") wins first — otherwise NEW_RE swallows it as
  // a 3-digit major with leading zeros, which we don't want for the new shape.
  const m2 = LEGACY_RE.exec(id);
  if (m2) return { major: Number(m2[1]!), minor: null };
  const m1 = NEW_RE.exec(id);
  if (m1) {
    const majorStr = m1[1]!;
    if (majorStr.length > 1 && majorStr.startsWith("0")) return null;
    const minor = m1[2] !== undefined ? Number(m1[2]) : null;
    return { major: Number(majorStr), minor };
  }
  return null;
}

export function isValidVersionId(id: string): boolean {
  return parseVersionId(id) !== null;
}

export function computeNextVersionId(
  existing: ReadonlyArray<{ id: string }>,
  bump: VersionBump,
  custom?: string,
): string {
  if (custom !== undefined) {
    if (!isValidVersionId(custom) || /^v0\d{2,}$/.test(custom)) {
      throw new Error(`Invalid custom version id: ${JSON.stringify(custom)}`);
    }
    if (existing.some((v) => v.id === custom)) {
      throw new Error(`Version id already exists: ${custom}`);
    }
    return custom;
  }

  if (existing.length === 0) return "v1";

  const parsed = existing
    .map((v) => parseVersionId(v.id))
    .filter((p): p is ParsedVersionId => p !== null);
  if (parsed.length === 0) return "v1";

  const headMajor = parsed.reduce((max, p) => Math.max(max, p.major), 0);

  if (bump === "major") return `v${headMajor + 1}`;

  const minorsForHead = parsed
    .filter((p) => p.major === headMajor && p.minor !== null)
    .map((p) => p.minor as number);
  const nextMinor = minorsForHead.length > 0 ? Math.max(...minorsForHead) + 1 : 1;
  return `v${headMajor}.${nextMinor}`;
}
