import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CmgcRubricView } from "./cmgc-rubric-view";
import { RUBRIC_QUESTIONS, SECTION_WEIGHTS } from "@/lib/usecases/cmgc-pde/rubric";

describe("CmgcRubricView", () => {
  it("renders one section header per distinct section in the rubric", () => {
    render(<CmgcRubricView />);
    // Section labels are now stored as "A: Project Scope & Characteristics" but
    // displayed as the trailing name only. Assert on the displayed name.
    const names = new Set(
      RUBRIC_QUESTIONS.map((q) => q.section.replace(/^[A-Z]:\s*/, "")),
    );
    for (const name of names) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it("renders every question id from the rubric", () => {
    render(<CmgcRubricView />);
    for (const q of RUBRIC_QUESTIONS) {
      expect(screen.getByText(q.id)).toBeInTheDocument();
    }
  });

  it("displays the section-weights bar with the rounded percentages", () => {
    render(<CmgcRubricView />);
    // Weights bar renders the key and percent in separate spans.
    expect(screen.getByText(`${Math.round(SECTION_WEIGHTS.A * 100)}%`)).toBeInTheDocument();
    expect(screen.getByText(`${Math.round(SECTION_WEIGHTS.F * 100)}%`)).toBeInTheDocument();
    expect(screen.getByText(/Section Weights/i)).toBeInTheDocument();
  });
});
