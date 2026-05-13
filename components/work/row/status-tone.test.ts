import { describe, it, expect } from "vitest";
import { STATUS_TONE, type RowStatus, statusFromScore } from "./status-tone";

describe("STATUS_TONE", () => {
  const all: RowStatus[] = ["Pass", "Warning", "Fail", "N/A", "Error"];
  it("has cell + row classes for every status", () => {
    for (const s of all) {
      expect(STATUS_TONE[s].cell).toMatch(/^bg-/);
      expect(STATUS_TONE[s].rowBorder).toMatch(/border-l-/);
    }
  });
  it("uses the soft theme-toned emerald palette for Pass", () => {
    expect(STATUS_TONE.Pass.cell).toContain("bg-emerald-50");
    expect(STATUS_TONE.Pass.cell).toContain("text-emerald-700");
  });
  it("uses the soft theme-toned rose palette for Fail", () => {
    expect(STATUS_TONE.Fail.cell).toContain("bg-rose-50");
    expect(STATUS_TONE.Fail.cell).toContain("text-rose-700");
  });
});

describe("statusFromScore", () => {
  it("maps -1 to N/A", () => expect(statusFromScore(-1)).toBe("N/A"));
  it("maps 0 to Error", () => expect(statusFromScore(0)).toBe("Error"));
  it("maps 1-2 to Fail", () => {
    expect(statusFromScore(1)).toBe("Fail");
    expect(statusFromScore(2)).toBe("Fail");
  });
  it("maps 3 to Warning", () => expect(statusFromScore(3)).toBe("Warning"));
  it("maps 4-5 to Pass", () => {
    expect(statusFromScore(4)).toBe("Pass");
    expect(statusFromScore(5)).toBe("Pass");
  });
});
