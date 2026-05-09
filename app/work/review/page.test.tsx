import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ReviewPicker from "./page";

describe("ReviewPicker", () => {
  it("renders a primary 'Open evaluator' link and a secondary 'Preview rubric' link per use case", () => {
    render(<ReviewPicker />);
    const openLinks = screen.getAllByRole("link", { name: /open evaluator/i });
    const rubricLinks = screen.getAllByRole("link", { name: /preview rubric/i });
    // 3 use cases registered with tile: "review" — CMGC, CUCP, ROW
    expect(openLinks).toHaveLength(3);
    expect(rubricLinks).toHaveLength(3);
  });

  it("preview rubric links point to /work/review/<id>/rubric", () => {
    render(<ReviewPicker />);
    const rubricLinks = screen.getAllByRole("link", { name: /preview rubric/i });
    const hrefs = rubricLinks.map((a) => a.getAttribute("href")).sort();
    expect(hrefs).toEqual([
      "/work/review/cmgc-pde/rubric",
      "/work/review/cucp-reevals/rubric",
      "/work/review/row-appraisal/rubric",
    ]);
  });
});
