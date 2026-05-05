import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ValidationCard } from "./validation-card";
import type { ValidationResult } from "@/lib/usecases/cmgc-pde/types";

describe("ValidationCard", () => {
  it("renders nothing when validation is null", () => {
    const { container } = render(<ValidationCard validation={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows agreement rate when validation present", () => {
    const v: ValidationResult = {
      comparisons: [],
      mismatches: [],
      summary: { total_compared: 25, matches: 23, minor_mismatches: 1, major_mismatches: 1, agreement_rate: 92.0 },
      deviation_impact: { ai_method: "CM/GC", user_method: "CM/GC", recommendation_changed: false, ai_score: 2.0, user_score: 2.0 },
    };
    render(<ValidationCard validation={v} />);
    expect(screen.getByText("92%")).toBeDefined();
    expect(screen.getByText("23/25")).toBeDefined();
  });

  it("highlights deviation callout when recommendation_changed true", () => {
    const v: ValidationResult = {
      comparisons: [], mismatches: [],
      summary: { total_compared: 25, matches: 20, minor_mismatches: 3, major_mismatches: 2, agreement_rate: 80 },
      deviation_impact: { ai_method: "CM/GC", user_method: "PDB", recommendation_changed: true, ai_score: 2.0, user_score: 2.5 },
    };
    render(<ValidationCard validation={v} />);
    const callout = screen.getByTestId("deviation-callout");
    expect(callout.className).toContain("amber");
    expect(callout.textContent).toContain("changed");
  });
});
