import { describe, it, expect } from "vitest";
import { parseChunkResults } from "./parse-chunk-results";

const SAMPLE_ITEMS = [
  {
    category: "Title Page",
    score: 4,
    criteria_met: "Yes",
    evidence: "Found on page 1",
    status: "✅ Pass",
    comments: "",
  },
  {
    category: "Reconciliation",
    score: 3,
    criteria_met: "Partial",
    evidence: "Reconciliation section present",
    status: "⚠️ Warning",
    comments: "Needs more detail",
  },
];

describe("parseChunkResults", () => {
  it("parses a plain JSON array (no fences) into EvaluationResult items", () => {
    const json = JSON.stringify(SAMPLE_ITEMS);
    const results = parseChunkResults(json, ["Title Page", "Reconciliation"]);
    expect(results).toHaveLength(2);
    expect(results[0].category).toBe("Title Page");
    expect(results[0].score).toBe(4);
    expect(results[1].category).toBe("Reconciliation");
  });

  it("strips ```json ... ``` fences before parsing", () => {
    const json = `\`\`\`json\n${JSON.stringify(SAMPLE_ITEMS)}\n\`\`\``;
    const results = parseChunkResults(json, ["Title Page", "Reconciliation"]);
    expect(results).toHaveLength(2);
    expect(results[0].category).toBe("Title Page");
  });

  it('maps "Reconciliation" to "Reconciliation", NOT "HABU Reconciliation" (longest-substring tiebreak)', () => {
    // "Reconciliation" is a substring of "HABU Reconciliation" and also matches "Reconciliation" exactly.
    // The fuzzy path should pick "Reconciliation" because exact match fires first.
    const item = [
      {
        category: "Reconciliation",
        score: 3,
        criteria_met: "Yes",
        evidence: "Present",
        status: "✅ Pass",
        comments: "",
      },
    ];
    const results = parseChunkResults(JSON.stringify(item), ["Reconciliation"]);
    expect(results).toHaveLength(1);
    expect(results[0].category).toBe("Reconciliation");
  });

  it('stores score "N/A" as -1', () => {
    const item = [
      {
        category: "Title Page",
        score: "N/A",
        criteria_met: "N/A",
        evidence: "N/A",
        status: "⚪ N/A",
        comments: "",
      },
    ];
    const results = parseChunkResults(JSON.stringify(item), ["Title Page"]);
    expect(results).toHaveLength(1);
    expect(results[0].score).toBe(-1);
  });

  it("stores numeric score 5 as 5", () => {
    const item = [
      {
        category: "Title Page",
        score: 5,
        criteria_met: "Yes",
        evidence: "Full compliance",
        status: "✅ Pass",
        comments: "",
      },
    ];
    const results = parseChunkResults(JSON.stringify(item), ["Title Page"]);
    expect(results).toHaveLength(1);
    expect(results[0].score).toBe(5);
  });

  it("silently drops items with unknown categories", () => {
    const items = [
      {
        category: "Nonexistent Category XYZ",
        score: 3,
        criteria_met: "Yes",
        evidence: "N/A",
        status: "✅ Pass",
        comments: "",
      },
      {
        category: "Title Page",
        score: 3,
        criteria_met: "Yes",
        evidence: "Present",
        status: "✅ Pass",
        comments: "",
      },
    ];
    const results = parseChunkResults(JSON.stringify(items), ["Title Page"]);
    expect(results).toHaveLength(1);
    expect(results[0].category).toBe("Title Page");
  });

  it("returns [] for malformed JSON", () => {
    const results = parseChunkResults("{ not valid json }", ["Title Page"]);
    expect(results).toEqual([]);
  });

  it("returns [] for empty content", () => {
    const results = parseChunkResults("", ["Title Page"]);
    expect(results).toEqual([]);
  });
});
