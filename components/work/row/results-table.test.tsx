import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResultsTable } from "./results-table";
import { VALID_CATEGORIES } from "@/lib/usecases/row-appraisal/data/valid-categories";
import type { EvaluationResult } from "@/lib/usecases/row-appraisal/types";

const CYCLING_SCORES = [-1, 5, 1, 3];

const MOCK_RESULTS: EvaluationResult[] = VALID_CATEGORIES.map((category, i) => {
  const score = CYCLING_SCORES[i % CYCLING_SCORES.length]!;
  return {
    category,
    score,
    criteria_met: "test criteria",
    evidence: "test evidence",
    status: score === -1 ? "⚪ N/A" : score >= 4 ? "✅ Pass" : score === 3 ? "⚠️ Warning" : "❌ Fail",
    comments: "test comment",
  };
});

describe("ResultsTable", () => {
  it("renders all 34 category names", () => {
    render(<ResultsTable results={MOCK_RESULTS} />);
    for (const category of VALID_CATEGORIES) {
      expect(screen.getByText(category)).toBeDefined();
    }
  });

  it("score -1 shows N/A with muted class", () => {
    const results: EvaluationResult[] = [{
      category: "Title Page",
      score: -1,
      criteria_met: "",
      evidence: "",
      status: "⚪ N/A",
      comments: "",
    }];
    render(<ResultsTable results={results} />);
    const cell = screen.getByText("N/A");
    expect(cell.className).toContain("bg-muted");
    expect(cell.className).toContain("text-muted-foreground");
  });

  it("score 5 has emerald class", () => {
    const results: EvaluationResult[] = [{
      category: "Title Page",
      score: 5,
      criteria_met: "",
      evidence: "",
      status: "✅ Pass",
      comments: "",
    }];
    render(<ResultsTable results={results} />);
    const cell = screen.getByText("5");
    expect(cell.className).toContain("bg-emerald-50");
    expect(cell.className).toContain("text-emerald-700");
  });

  it("score 1 has rose class", () => {
    const results: EvaluationResult[] = [{
      category: "Title Page",
      score: 1,
      criteria_met: "",
      evidence: "",
      status: "❌ Fail",
      comments: "",
    }];
    render(<ResultsTable results={results} />);
    const cell = screen.getByText("1");
    expect(cell.className).toContain("bg-rose-50");
    expect(cell.className).toContain("text-rose-700");
  });

  it("score 3 has amber class", () => {
    const results: EvaluationResult[] = [{
      category: "Title Page",
      score: 3,
      criteria_met: "",
      evidence: "",
      status: "⚠️ Warning",
      comments: "",
    }];
    render(<ResultsTable results={results} />);
    const cell = screen.getByText("3");
    expect(cell.className).toContain("bg-amber-50");
    expect(cell.className).toContain("text-amber-800");
  });

  it("applies Fail tone to score cell when score is 1", () => {
    const results = [{ category: "Title Page", score: 1, status: "❌ Fail", criteria_met: "", evidence: "", comments: "" }];
    // @ts-expect-error structural input fine for test
    const { container } = render(<ResultsTable results={results} />);
    const cell = container.querySelector("[data-row-status='Fail']");
    expect(cell?.className).toContain("bg-rose-50");
  });
});
