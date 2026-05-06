import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { addPrecedent, buildPrecedentsBlock, getPrecedents } from "./precedents";

const DB_PATH = join(
  process.cwd(),
  "lib/usecases/cucp-reevals/memory/memory-db.json",
);

let snapshot: string;

beforeEach(() => {
  snapshot = readFileSync(DB_PATH, "utf8");
});

afterEach(() => {
  writeFileSync(DB_PATH, snapshot, "utf8");
});

describe("CUCP precedents", () => {
  it("loads the seeded level-1 PNW precedent from memory-db.json", () => {
    const lvl1 = getPrecedents(1);
    expect(lvl1.length).toBe(1);
    expect(lvl1[0]!.target).toBe("Narrative Declared PNW");
    expect(lvl1[0]!.correction).toBe("4020287");
  });

  it("returns empty arrays for unseeded levels", () => {
    expect(getPrecedents(2)).toEqual([]);
    expect(getPrecedents(3)).toEqual([]);
  });

  it("builds level-1 block with the correct caltrans wording", () => {
    const block = buildPrecedentsBlock(1);
    expect(block).toContain("INSTITUTIONAL MEMORY - LEVEL 1 HUMAN CORRECTIONS:");
    expect(block).toContain("If you see 'Narrative Declared PNW', apply correction: '4020287'");
    expect(block).toContain("Reason: we approximate it");
  });

  it("emits empty string when level has no precedents", () => {
    expect(buildPrecedentsBlock(2)).toBe("");
    expect(buildPrecedentsBlock(3)).toBe("");
  });

  it("addPrecedent writes a new level-2 entry that getPrecedents reads back", () => {
    const before = getPrecedents(2).length;
    const { count } = addPrecedent(2, "Cap-source loan denial", "Economic Disadvantage", "Bank denial without race-based context still counts as economic barrier per §26.67");
    expect(count).toBe(before + 1);

    const after = getPrecedents(2);
    expect(after.length).toBe(before + 1);
    expect(after.at(-1)).toEqual({
      target: "Cap-source loan denial",
      correction: "Economic Disadvantage",
      human_reasoning: "Bank denial without race-based context still counts as economic barrier per §26.67",
    });
  });

  it("addPrecedent persists across multiple calls without losing prior entries", () => {
    addPrecedent(3, "Net-worth borderline", "Pass", "Within $50k of threshold and applicant is otherwise eligible");
    addPrecedent(3, "Missing PNW worksheet", "Fail", "Cannot determine eligibility without worksheet");
    const lvl3 = getPrecedents(3);
    expect(lvl3.length).toBe(2);
    expect(lvl3[0]!.correction).toBe("Pass");
    expect(lvl3[1]!.correction).toBe("Fail");
  });

  it("buildPrecedentsBlock includes newly-added entries", () => {
    addPrecedent(2, "Vendor non-payment", "Ordinary Business Risk", "Standard contract dispute, not §26.67 disadvantage");
    const block = buildPrecedentsBlock(2);
    expect(block).toContain("INSTITUTIONAL MEMORY - LEVEL 2 HUMAN CORRECTIONS:");
    expect(block).toContain("Scenario: 'Vendor non-payment' -> Classify as: 'Ordinary Business Risk'");
  });
});
