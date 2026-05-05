import { describe, it, expect } from "vitest";
import { buildSystemPrompt, buildUserMessage } from "./system-prompt";

describe("buildSystemPrompt", () => {
  it("includes persona, KB, rubric, output schema", () => {
    const prompt = buildSystemPrompt("KB-PLACEHOLDER");
    expect(prompt).toContain("Senior Alternative Contracting Expert");
    expect(prompt).toContain("KB-PLACEHOLDER");
    expect(prompt).toContain("[A1]");
    expect(prompt).toContain("[F3]");
    expect(prompt).toContain("OUTPUT FORMAT");
    expect(prompt).toContain("EXACTLY 25 items");
  });

  it("includes the design-sequencing block and baseline norms", () => {
    const prompt = buildSystemPrompt("KB");
    expect(prompt).toContain("DESIGN-SEQUENCING");
    expect(prompt).toContain("CALTRANS BASELINE NORMS");
  });

  it("includes the few-shot examples", () => {
    const prompt = buildSystemPrompt("KB");
    expect(prompt).toContain("EVALUATION METHODOLOGY");
    expect(prompt).toContain("EXAMPLE 1");
    expect(prompt).toContain("EXAMPLE 2");
    expect(prompt).toContain("EXAMPLE 3");
  });

  it("includes the exclusion block", () => {
    const prompt = buildSystemPrompt("KB");
    expect(prompt).toContain("IMPORTANT EXCLUSIONS");
    expect(prompt).toContain("Sections 13");
  });

  it("appends district pre-fills when supplied (alphabetical)", () => {
    const prompt = buildSystemPrompt("KB", { B1: "A", A1: "B", A2: "C" });
    expect(prompt).toContain("DISTRICT PRE-FILLED RATINGS");
    // Sorted: A1=B, A2=C, B1=A
    expect(prompt).toMatch(/A1=B,\s*A2=C,\s*B1=A/);
  });

  it("omits district block when no pre-fills", () => {
    const prompt = buildSystemPrompt("KB");
    expect(prompt).not.toContain("DISTRICT PRE-FILLED RATINGS");
  });

  it("omits district block when pre-fills object is empty", () => {
    const prompt = buildSystemPrompt("KB", {});
    expect(prompt).not.toContain("DISTRICT PRE-FILLED RATINGS");
  });

  it("rubric text shows section headers grouped by section", () => {
    const prompt = buildSystemPrompt("KB");
    expect(prompt).toContain("--- A: Project Scope & Characteristics ---");
    expect(prompt).toContain("--- F: Staffing Issues ---");
  });
});

describe("buildUserMessage", () => {
  it("contains the narrative text and the introductory line", () => {
    const msg = buildUserMessage("This is the narrative content.");
    expect(msg).toContain("Please evaluate the following Alternative Delivery Nomination Fact Sheet");
    expect(msg).toContain("NOMINATION FACT SHEET CONTENT:");
    expect(msg).toContain("This is the narrative content.");
  });
});
