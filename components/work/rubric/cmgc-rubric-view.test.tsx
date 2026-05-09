import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CmgcRubricView } from "./cmgc-rubric-view";
import { RUBRIC_QUESTIONS, SECTION_WEIGHTS } from "@/lib/usecases/cmgc-pde/rubric";

describe("CmgcRubricView", () => {
  it("renders one section header per distinct section in the rubric", () => {
    render(<CmgcRubricView />);
    const sections = new Set(RUBRIC_QUESTIONS.map((q) => q.section));
    for (const section of sections) {
      expect(screen.getByText(section)).toBeInTheDocument();
    }
  });

  it("renders every question id from the rubric", () => {
    render(<CmgcRubricView />);
    for (const q of RUBRIC_QUESTIONS) {
      expect(screen.getByText(q.id)).toBeInTheDocument();
    }
  });

  it("displays the section-weight chips with rounded percentages", () => {
    render(<CmgcRubricView />);
    expect(screen.getByText(`A ${Math.round(SECTION_WEIGHTS.A * 100)}%`)).toBeInTheDocument();
    expect(screen.getByText(`F ${Math.round(SECTION_WEIGHTS.F * 100)}%`)).toBeInTheDocument();
  });
});
