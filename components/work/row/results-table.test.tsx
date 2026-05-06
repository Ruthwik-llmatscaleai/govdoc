import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResultsTable } from "./results-table";
import { VALID_CATEGORIES } from "@/lib/usecases/row-appraisal/data/valid-categories";
import type { EvaluationResult } from "@/lib/usecases/row-appraisal/types";

const CYCLING_SCORES = [-1, 5, 1, 3];

const MOCK_RESULTS: EvaluationResult[] = VALID_CATEGORIES.map((category, i) => ({
  category,
  score: CYCLING_SCORES[i % CYCLING_SCORES.length],
  criteria_met: "test criteria",
  evidence: "test evidence",
  status: CYCLING_SCORES[i % CYCLING_SCORES.length] === -1 ? "⚪ N/A" : CYCLING_SCORES[i % CYCLING_SCORES.length] >= 4 ? "✅ Pass" : CYCLING_SCORES[i % CYCLING_SCORES.length] === 3 ? "⚠️ Warning" : "❌ Fail",
  comments: "test comment",
}));

describe("ResultsTable", () => {
  it("renders all 34 category names", () => {
    render(<ResultsTable results={MOCK_RESULTS} />);
    for (const category of VALID_CATEGORIES) {
      expect(screen.getByText(category)).toBeDefined();
    }
  });

  it("score -1 shows N/A with gray class", () => {
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
    expect(cell.className).toContain("bg-gray-100");
    expect(cell.className).toContain("text-gray-700");
  });

  it("score 5 has green class", () => {
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
    expect(cell.className).toContain("bg-green-100");
    expect(cell.className).toContain("text-green-800");
  });

  it("score 1 has red class", () => {
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
    expect(cell.className).toContain("bg-red-100");
    expect(cell.className).toContain("text-red-800");
  });

  it("score 3 has yellow class", () => {
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
    expect(cell.className).toContain("bg-yellow-100");
    expect(cell.className).toContain("text-yellow-800");
  });
});
