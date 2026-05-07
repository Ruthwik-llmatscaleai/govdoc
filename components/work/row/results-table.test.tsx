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
    expect(cell.className).toContain("bg-[#e2e3e5]");
    expect(cell.className).toContain("text-[#383d41]");
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
    expect(cell.className).toContain("bg-[#d4edda]");
    expect(cell.className).toContain("text-[#155724]");
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
    expect(cell.className).toContain("bg-[#f8d7da]");
    expect(cell.className).toContain("text-[#721c24]");
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
    expect(cell.className).toContain("bg-[#fff3cd]");
    expect(cell.className).toContain("text-[#856404]");
  });

  it("applies caltrans Fail color to score cell when score is 1", () => {
    const results = [{ category: "Title Page", score: 1, status: "❌ Fail", criteria_met: "", evidence: "", comments: "" }];
    // @ts-expect-error structural input fine for test
    const { container } = render(<ResultsTable results={results} />);
    const cell = container.querySelector("[data-row-status='Fail']");
    expect(cell?.className).toContain("#f8d7da");
  });
});
