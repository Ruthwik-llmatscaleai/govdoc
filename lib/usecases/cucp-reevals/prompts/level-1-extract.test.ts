import { describe, it, expect } from "vitest";
import { buildLevel1SystemPrompt, buildLevel1UserMessage } from "./level-1-extract";

describe("buildLevel1SystemPrompt", () => {
  it("omits the SUPPLEMENTARY REVENUE DATA block when no firm revenues provided", () => {
    const p = buildLevel1SystemPrompt();
    expect(p).not.toContain("SUPPLEMENTARY REVENUE DATA");
  });

  it("omits the SUPPLEMENTARY REVENUE DATA block when revenues object is empty", () => {
    const p = buildLevel1SystemPrompt({});
    expect(p).not.toContain("SUPPLEMENTARY REVENUE DATA");
  });

  it("includes the JSON-stringified firm revenues when provided", () => {
    const p = buildLevel1SystemPrompt({ "Acme LLC": { revenue: 1500000, pnw: 800000 } });
    expect(p).toContain("SUPPLEMENTARY REVENUE DATA");
    expect(p).toContain("Acme LLC");
    expect(p).toContain("1500000");
  });

  it("contains the §26.67 anchor and OUTPUT FORMAT header", () => {
    const p = buildLevel1SystemPrompt();
    expect(p).toContain("49 CFR §26.67");
    expect(p).toContain("OUTPUT FORMAT");
  });

  it("describes the W5 extraction rules", () => {
    const p = buildLevel1SystemPrompt();
    expect(p).toContain("W5");
    expect(p).toContain("demographic_flag");
  });
});

describe("buildLevel1UserMessage", () => {
  it("wraps the narrative under an 'Applicant narrative' header", () => {
    const msg = buildLevel1UserMessage("Some narrative text.");
    expect(msg).toContain("Applicant narrative:");
    expect(msg).toContain("Some narrative text.");
  });
});
