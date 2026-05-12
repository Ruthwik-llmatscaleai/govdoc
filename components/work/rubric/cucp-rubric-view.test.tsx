import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CucpRubricView } from "./cucp-rubric-view";
import {
  CUCP_L2_CATEGORIES,
  CUCP_L3_CRITERIA,
} from "@/lib/usecases/cucp-reevals/rubric";

describe("CucpRubricView", () => {
  it("defaults to the §26.67 rubric tab", () => {
    render(<CucpRubricView />);
    expect(
      screen.getByRole("heading", {
        name: /Rubric for Evaluating Social and Economic Disadvantage/i,
      }),
    ).toBeInTheDocument();
  });

  it("renders the Mandatory Eligibility section using PDF-style headings", () => {
    render(<CucpRubricView />);
    const mandatory = CUCP_L3_CRITERIA.filter((c) => c.s_no <= 3);
    for (const c of mandatory) {
      expect(screen.getByText(c.title ?? c.name)).toBeInTheDocument();
    }
  });

  it("renders the Scored Evaluation Criteria with YES/NO definitions", () => {
    render(<CucpRubricView />);
    const evaluation = CUCP_L3_CRITERIA.filter((c) => c.s_no >= 4);
    for (const c of evaluation) {
      expect(screen.getByText(c.title ?? c.name)).toBeInTheDocument();
      if (c.pass) expect(screen.getByText(c.pass)).toBeInTheDocument();
      if (c.fail) expect(screen.getByText(c.fail)).toBeInTheDocument();
    }
  });

  it("renders the gating rule and Final Determination sections", () => {
    render(<CucpRubricView />);
    expect(
      screen.getByText(/the firm is not eligible for certification/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/preponderance of the evidence that the applicant/i),
    ).toBeInTheDocument();
  });

  it("opens the L2 section and shows all 5 legal categories", async () => {
    const user = userEvent.setup();
    render(<CucpRubricView />);
    await user.click(screen.getByRole("button", { name: /Level 2 — Legal Categories/i }));
    for (const c of CUCP_L2_CATEGORIES) {
      expect(screen.getByText(c.name)).toBeInTheDocument();
      expect(screen.getByText(c.description)).toBeInTheDocument();
    }
  });
});
