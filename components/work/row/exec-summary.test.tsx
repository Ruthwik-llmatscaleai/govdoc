import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExecSummary } from "./exec-summary";
import type { EvaluationResult } from "@/lib/usecases/row-appraisal/types";

function r(category: string, score: number, comments = "Comments"): EvaluationResult {
  return {
    category,
    score,
    criteria_met: "x",
    evidence: "x",
    status: "✅ Pass",
    comments,
  };
}

describe("ExecSummary", () => {
  it("renders Pass for score 4-5, Warning for 3, Fail for 1-2, N/A for -1", () => {
    render(
      <ExecSummary
        results={[
          r("Pass5", 5),
          r("Pass4", 4),
          r("Warn", 3),
          r("Fail2", 2),
          r("Fail1", 1),
          r("NA", -1),
        ]}
      />,
    );
    expect(screen.getAllByText(/^Pass$/).length).toBe(2);
    expect(screen.getByText(/^Warning$/)).toBeDefined();
    expect(screen.getAllByText(/^Fail$/).length).toBe(2);
    expect(screen.getAllByText(/N\/A/).length).toBeGreaterThan(0);
  });
});
