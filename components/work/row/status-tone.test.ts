import { describe, it, expect } from "vitest";
import { STATUS_TONE, type RowStatus, statusFromScore } from "./status-tone";

describe("STATUS_TONE", () => {
  const all: RowStatus[] = ["Pass", "Warning", "Fail", "N/A", "Error"];
  it("has cell + row classes for every status", () => {
    for (const s of all) {
      expect(STATUS_TONE[s].cell).toMatch(/bg-\[/);
      expect(STATUS_TONE[s].rowBorder).toMatch(/border-l-/);
    }
  });
  it("uses the caltrans pass green for Pass", () => {
    expect(STATUS_TONE.Pass.cell).toContain("#d4edda");
    expect(STATUS_TONE.Pass.cell).toContain("#155724");
  });
  it("uses the caltrans fail red for Fail", () => {
    expect(STATUS_TONE.Fail.cell).toContain("#f8d7da");
    expect(STATUS_TONE.Fail.cell).toContain("#721c24");
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
