import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RowResultTabs } from "./result-tabs";
import type { EvaluationResult } from "@/lib/usecases/row-appraisal/types";

const results: EvaluationResult[] = [
  { category: "Title Page", score: 5, status: "✅ Pass", criteria_met: "", evidence: "", comments: "ok" },
  { category: "Improvements", score: 1, status: "❌ Fail", criteria_met: "", evidence: "Missing", comments: "" },
];

describe("RowResultTabs", () => {
  it("renders three tabs labelled like caltrans", () => {
    render(<RowResultTabs results={results} />);
    expect(screen.getByRole("tab", { name: /executive summary/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /detailed findings/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /action items/i })).toBeInTheDocument();
  });

  it("starts on Executive Summary", () => {
    render(<RowResultTabs results={results} />);
    expect(screen.getByRole("tab", { name: /executive summary/i })).toHaveAttribute("data-selected", "true");
  });

  it("switches to Action Items when clicked", () => {
    render(<RowResultTabs results={results} />);
    fireEvent.click(screen.getByRole("tab", { name: /action items/i }));
    expect(screen.getByRole("tab", { name: /action items/i })).toHaveAttribute("data-selected", "true");
  });
});
