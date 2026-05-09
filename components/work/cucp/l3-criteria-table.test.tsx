import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { L3CriteriaTable } from "./l3-criteria-table";
import type { Criterion } from "@/lib/usecases/cucp-reevals/types";

const passCriterion: Criterion = {
  s_no: 1,
  category: "Owner Disadvantage",
  qualification: "Socially and economically disadvantaged",
  rule_requires: "49 CFR §26.67(a)(1)",
  evidence_summary: "Owner is a member of a presumptively disadvantaged group.",
  reasoning: "Affidavit on file confirms group membership.",
  pass_fail: "Pass",
  request_info: "No",
  confidence: 0.92,
};

const failCriterion: Criterion = {
  s_no: 2,
  category: "Personal Net Worth",
  qualification: "PNW under cap",
  rule_requires: "49 CFR §26.67(b)",
  evidence_summary: "Owner PNW exceeds the $1.32M cap.",
  reasoning: "Statement shows $1.5M net worth.",
  pass_fail: "Fail",
  request_info: "No",
  confidence: 0.88,
};

const infoCriterion: Criterion = {
  s_no: 3,
  category: "Control",
  qualification: "Day-to-day control",
  rule_requires: "49 CFR §26.71",
  evidence_summary: "Bylaws unclear on day-to-day operations.",
  reasoning: "Need additional documentation.",
  pass_fail: "Pass",
  request_info: "Yes",
  confidence: 0.55,
};

describe("L3CriteriaTable", () => {
  it("renders 5 columns: # / Criterion / AI Verdict / Confidence / Reasoning", () => {
    render(<L3CriteriaTable criteria={[passCriterion]} />);
    const headers = screen.getAllByRole("columnheader").map((h) => h.textContent);
    expect(headers).toEqual(["#", "Criterion", "AI Verdict", "Confidence", "Reasoning"]);
  });

  it("renders one row per criterion with AI verdict from pass_fail", () => {
    render(<L3CriteriaTable criteria={[passCriterion, failCriterion]} />);
    const rows = screen.getAllByRole("row");
    // 1 header row + 2 data rows
    expect(rows).toHaveLength(3);
    expect(within(rows[1]!).getByText("Pass")).toBeTruthy();
    expect(within(rows[2]!).getByText("Fail")).toBeTruthy();
  });

  it("formats confidence to 2 decimals", () => {
    render(<L3CriteriaTable criteria={[passCriterion]} />);
    expect(screen.getByText("0.92")).toBeTruthy();
  });

  it("displays category and qualification together as the criterion cell", () => {
    render(<L3CriteriaTable criteria={[passCriterion]} />);
    expect(screen.getByText(/Owner Disadvantage/)).toBeTruthy();
    expect(screen.getByText(/Socially and economically disadvantaged/)).toBeTruthy();
  });

  it("colors Pass rows with caltrans pass palette", () => {
    const { container } = render(<L3CriteriaTable criteria={[passCriterion]} />);
    const verdictCell = container.querySelector("td[data-verdict='pass']");
    expect(verdictCell).not.toBeNull();
    expect(verdictCell!.className).toMatch(/bg-\[#d4edda\]/);
  });

  it("colors Fail rows with caltrans fail palette", () => {
    const { container } = render(<L3CriteriaTable criteria={[failCriterion]} />);
    const verdictCell = container.querySelector("td[data-verdict='fail']");
    expect(verdictCell).not.toBeNull();
    expect(verdictCell!.className).toMatch(/bg-\[#f8d7da\]/);
  });

  it("colors Request Info rows with caltrans warning palette", () => {
    const { container } = render(<L3CriteriaTable criteria={[infoCriterion]} />);
    const verdictCell = container.querySelector("td[data-verdict='warning']");
    expect(verdictCell).not.toBeNull();
    expect(verdictCell!.className).toMatch(/bg-\[#fff3cd\]/);
  });

  it("when overrideMap provides a new verdict, displays the override verdict and reason", () => {
    render(
      <L3CriteriaTable
        criteria={[passCriterion]}
        overrideMap={{
          "1": {
            verdict: "Fail",
            request_info: "No",
            reason: "Affidavit was incomplete on review.",
          },
        }}
      />,
    );
    expect(screen.getByText("Fail")).toBeTruthy();
    expect(screen.getByText("Affidavit was incomplete on review.")).toBeTruthy();
  });

  it("when overrideMap sets verdict to 'Request Additional Information', uses warning tone", () => {
    const { container } = render(
      <L3CriteriaTable
        criteria={[passCriterion]}
        overrideMap={{
          "1": {
            verdict: "Request Additional Information",
            request_info: "Yes",
            reason: "Need updated tax records.",
          },
        }}
      />,
    );
    const verdictCell = container.querySelector("td[data-verdict='warning']");
    expect(verdictCell).not.toBeNull();
  });

  it("falls back to em-dash when fields are missing", () => {
    const sparse = {
      ...passCriterion,
      category: "",
      qualification: "",
      reasoning: "",
    };
    render(<L3CriteriaTable criteria={[sparse]} />);
    // confidence and verdict are still set, so we look for the reasoning cell
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
  });
});
