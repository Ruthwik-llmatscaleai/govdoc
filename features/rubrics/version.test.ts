import { describe, it, expect } from "vitest";
import { parseVersionId, computeNextVersionId, isValidVersionId } from "./version";

describe("parseVersionId", () => {
  it("parses new short form", () => {
    expect(parseVersionId("v1")).toEqual({ major: 1, minor: null });
    expect(parseVersionId("v23")).toEqual({ major: 23, minor: null });
  });

  it("parses new dotted form", () => {
    expect(parseVersionId("v1.2")).toEqual({ major: 1, minor: 2 });
    expect(parseVersionId("v10.15")).toEqual({ major: 10, minor: 15 });
  });

  it("parses legacy 3+ digit form", () => {
    expect(parseVersionId("v001")).toEqual({ major: 1, minor: null });
    expect(parseVersionId("v023")).toEqual({ major: 23, minor: null });
    expect(parseVersionId("v1000")).toEqual({ major: 1000, minor: null });
  });

  it("rejects garbage", () => {
    expect(parseVersionId("")).toBeNull();
    expect(parseVersionId("1.2")).toBeNull();
    expect(parseVersionId("v1.2.3")).toBeNull();
    expect(parseVersionId("v1.")).toBeNull();
    expect(parseVersionId("foo")).toBeNull();
  });
});

describe("isValidVersionId", () => {
  it("accepts both new and legacy shapes", () => {
    expect(isValidVersionId("v1")).toBe(true);
    expect(isValidVersionId("v1.2")).toBe(true);
    expect(isValidVersionId("v001")).toBe(true);
  });

  it("rejects invalid shapes", () => {
    expect(isValidVersionId("v1.2.3")).toBe(false);
    expect(isValidVersionId("V1")).toBe(false);
    expect(isValidVersionId("1.2")).toBe(false);
    expect(isValidVersionId("")).toBe(false);
  });
});

describe("computeNextVersionId", () => {
  it("returns v1 on an empty list (minor or major)", () => {
    expect(computeNextVersionId([], "minor")).toBe("v1");
    expect(computeNextVersionId([], "major")).toBe("v1");
  });

  it("bumps minor from a bare major head", () => {
    expect(computeNextVersionId([{ id: "v1" }], "minor")).toBe("v1.1");
    expect(computeNextVersionId([{ id: "v3" }], "minor")).toBe("v3.1");
  });

  it("bumps minor from a dotted head", () => {
    expect(computeNextVersionId([{ id: "v1.5" }, { id: "v1.4" }, { id: "v1" }], "minor")).toBe("v1.6");
  });

  it("bumps major and resets minor", () => {
    expect(computeNextVersionId([{ id: "v1.5" }], "major")).toBe("v2");
    expect(computeNextVersionId([{ id: "v2" }, { id: "v1.5" }], "major")).toBe("v3");
  });

  it("parses legacy entries as major-only", () => {
    expect(computeNextVersionId([{ id: "v003" }], "minor")).toBe("v3.1");
    expect(computeNextVersionId([{ id: "v003" }], "major")).toBe("v4");
    expect(computeNextVersionId([{ id: "v1.2" }, { id: "v002" }, { id: "v001" }], "minor")).toBe("v2.1");
  });

  it("accepts a valid custom id when unused", () => {
    expect(computeNextVersionId([{ id: "v1" }], "minor", "v5.7")).toBe("v5.7");
  });

  it("throws on invalid custom id", () => {
    expect(() => computeNextVersionId([], "minor", "foo")).toThrow(/Invalid custom version id/);
    expect(() => computeNextVersionId([], "minor", "v1.2.3")).toThrow(/Invalid custom version id/);
  });

  it("throws on duplicate custom id", () => {
    expect(() => computeNextVersionId([{ id: "v1.2" }], "minor", "v1.2")).toThrow(/already exists/);
  });
});
