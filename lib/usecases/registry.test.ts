import { describe, it, expect } from "vitest";
import { USE_CASES, USE_CASES_BY_TILE, getUseCase } from "./registry";

describe("use case registry", () => {
  it("registers cmgcPde", () => {
    expect(USE_CASES.cmgcPde).toBeDefined();
    expect(USE_CASES.cmgcPde.id).toBe("cmgc-pde");
  });

  it("getUseCase('cmgc-pde') returns the cmgcPde use case", () => {
    const uc = getUseCase("cmgc-pde");
    expect(uc).toBeDefined();
    expect(uc?.id).toBe("cmgc-pde");
    expect(uc?.tile).toBe("review");
  });

  it("getUseCase returns undefined for unknown ids", () => {
    expect(getUseCase("nonexistent")).toBeUndefined();
  });

  it("USE_CASES_BY_TILE.review contains cmgcPde", () => {
    expect(USE_CASES_BY_TILE.review).toContain(USE_CASES.cmgcPde);
  });

  it("non-review tiles are empty arrays", () => {
    expect(USE_CASES_BY_TILE.search).toEqual([]);
    expect(USE_CASES_BY_TILE.draft).toEqual([]);
    expect(USE_CASES_BY_TILE.inbox).toEqual([]);
  });

  it("cmgcPde has a 4-step pipeline", () => {
    expect(USE_CASES.cmgcPde.pipeline).toHaveLength(4);
    expect(USE_CASES.cmgcPde.pipeline.map((s) => s.id)).toEqual(["extract", "evaluate", "score", "validate"]);
  });

  it("cmgcPde has 2 exporters (xlsx, docx)", () => {
    const ids = USE_CASES.cmgcPde.exporters.map((e) => e.id);
    expect(ids).toContain("xlsx");
    expect(ids).toContain("docx");
  });

  it("cmgcPde has 4 inputs", () => {
    expect(USE_CASES.cmgcPde.inputs).toHaveLength(4);
    const inputIds = USE_CASES.cmgcPde.inputs.map((i) => i.id);
    expect(inputIds).toEqual(["factSheet", "projectName", "districtRatings", "model"]);
  });
});
