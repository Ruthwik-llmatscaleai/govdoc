import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type Precedent = {
  target: string;
  correction: string;
  human_reasoning: string;
};

export type Level = 1 | 2 | 3;

type Db = {
  level_1_precedents: Precedent[];
  level_2_precedents: Precedent[];
  level_3_precedents: Precedent[];
};

const DB_PATH = join(
  process.cwd(),
  "lib/usecases/cucp-reevals/memory/memory-db.json",
);

const KEY: Record<Level, keyof Db> = {
  1: "level_1_precedents",
  2: "level_2_precedents",
  3: "level_3_precedents",
};

const EMPTY_DB: Db = {
  level_1_precedents: [],
  level_2_precedents: [],
  level_3_precedents: [],
};

function loadDb(): Db {
  try {
    const raw = readFileSync(DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<Db>;
    return {
      level_1_precedents: parsed.level_1_precedents ?? [],
      level_2_precedents: parsed.level_2_precedents ?? [],
      level_3_precedents: parsed.level_3_precedents ?? [],
    };
  } catch {
    return EMPTY_DB;
  }
}

function saveDb(db: Db): void {
  writeFileSync(DB_PATH, JSON.stringify(db, null, 4) + "\n", "utf8");
}

export function getPrecedents(level: Level): Precedent[] {
  return loadDb()[KEY[level]];
}

export function addPrecedent(
  level: Level,
  target: string,
  correction: string,
  reasoning: string,
): { count: number } {
  const db = loadDb();
  db[KEY[level]].push({ target, correction, human_reasoning: reasoning });
  saveDb(db);
  return { count: db[KEY[level]].length };
}

export function buildPrecedentsBlock(level: Level): string {
  const precedents = getPrecedents(level);
  if (precedents.length === 0) return "";

  const lines = precedents.map((p) => {
    if (level === 1) {
      return `- If you see '${p.target}', apply correction: '${p.correction}'. Reason: ${p.human_reasoning}`;
    }
    if (level === 2) {
      return `- Scenario: '${p.target}' -> Classify as: '${p.correction}'. Reason: ${p.human_reasoning}`;
    }
    return `- Correction for '${p.target}': ${p.correction}. Reason: ${p.human_reasoning}`;
  });

  return `\n\nINSTITUTIONAL MEMORY - LEVEL ${level} HUMAN CORRECTIONS:\n${lines.join("\n")}`;
}
