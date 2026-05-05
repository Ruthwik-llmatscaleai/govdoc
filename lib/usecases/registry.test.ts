import { describe, it, expect } from "vitest";
import { getUseCase, USE_CASES_BY_TILE } from "./registry";

describe("registry", () => {
  it("returns undefined for unknown id", () => {
    expect(getUseCase("nope")).toBeUndefined();
  });
  it("exposes empty review tile in foundation phase", () => {
    expect(USE_CASES_BY_TILE.review).toEqual([]);
  });
  it("exposes empty stub tiles", () => {
    expect(USE_CASES_BY_TILE.search).toEqual([]);
    expect(USE_CASES_BY_TILE.draft).toEqual([]);
    expect(USE_CASES_BY_TILE.inbox).toEqual([]);
  });
});
