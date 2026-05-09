import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CucpStepper } from "./cucp-stepper";
import type { ExtractedFact, Criterion } from "@/lib/usecases/cucp-reevals/types";

const facts: ExtractedFact[] = [
  {
    id: "fact_1",
    when: "2018",
    where: "California",
    who: "Owner",
    what: "Personal loan to fund startup",
    why: "Family business",
    magnitude: "$50k",
    demographic_flag: true,
    source_quote: "I borrowed against my home.",
  },
];

const classifications = [
  {
    fact_id: "fact_1",
    category: "Social Disadvantage",
    summary: "Owner cited demographic bias.",
    ai_reasoning: "Affidavit references denied bids.",
  },
];

const criteria: Criterion[] = [
  {
    s_no: 1,
    category: "DBE Active",
    qualification: "Certification active and on file",
    rule_requires: "49 CFR §26.67(a)",
    evidence_summary: "Active certification verified.",
    reasoning: "On file in DBE registry.",
    pass_fail: "Pass",
    request_info: "No",
    confidence: 0.92,
  },
];

const baseProps = {
  facts,
  classifications,
  criteria,
  onSubmit: () => {},
};

describe("CucpStepper", () => {
  it("starts on Step 1 and shows the facts table (caltrans 9-col)", () => {
    render(<CucpStepper {...baseProps} />);
    expect(screen.getByRole("columnheader", { name: /Source Quote/i })).toBeTruthy();
  });

  it("advances to Step 2 (Legal Categories) on Approve & Continue", () => {
    render(<CucpStepper {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /Approve & Continue/i }));
    expect(screen.getByRole("columnheader", { name: /Legal Category/i })).toBeTruthy();
  });

  it("Back from Step 2 returns to Step 1 (facts table)", () => {
    render(<CucpStepper {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /Approve & Continue/i }));
    fireEvent.click(screen.getByRole("button", { name: /← Back to Facts/i }));
    expect(screen.getByRole("columnheader", { name: /Source Quote/i })).toBeTruthy();
  });

  it("Back from Step 3 returns to Step 2 (Legal Categories)", () => {
    render(<CucpStepper {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /Approve & Continue/i })); // L1→L2
    fireEvent.click(screen.getByRole("button", { name: /Approve & Continue/i })); // L2→L3
    fireEvent.click(screen.getByRole("button", { name: /← Back to Categories/i }));
    expect(screen.getByRole("columnheader", { name: /Legal Category/i })).toBeTruthy();
  });

  it("renders the request_info banner when an L3 override sets request_info=Yes", () => {
    render(<CucpStepper {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /Approve & Continue/i }));
    fireEvent.click(screen.getByRole("button", { name: /Approve & Continue/i }));

    fireEvent.change(screen.getByLabelText(/New verdict/i), {
      target: { value: "Request Additional Information" },
    });
    fireEvent.change(screen.getByLabelText(/^Reason/i), {
      target: { value: "needs payment records and timeline" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save Override/i }));

    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText(/pending additional information/i)).toBeTruthy();
  });

  it("calls onSubmit with collected overrides when Submit & Finalize is clicked", () => {
    const onSubmit = vi.fn();
    render(<CucpStepper {...baseProps} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: /Approve & Continue/i })); // L1→L2

    // Add an L2 override
    fireEvent.change(screen.getByLabelText(/New category/i), {
      target: { value: "Economic Disadvantage" },
    });
    fireEvent.change(screen.getByLabelText(/Legal Rationale/i), {
      target: { value: "Income data shows financial hardship." },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save Override/i }));

    fireEvent.click(screen.getByRole("button", { name: /Approve & Continue/i })); // L2→L3
    fireEvent.click(screen.getByRole("button", { name: /Submit & Finalize/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const payload = onSubmit.mock.calls[0]![0] as {
      l2: unknown[];
      l3: unknown[];
    };
    expect(payload.l2).toHaveLength(1);
    expect(payload.l3).toHaveLength(0);
  });

  it("Step 3 surfaces the Done view after Submit & Finalize with the L3 table still visible", () => {
    render(<CucpStepper {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /Approve & Continue/i }));
    fireEvent.click(screen.getByRole("button", { name: /Approve & Continue/i }));
    fireEvent.click(screen.getByRole("button", { name: /Submit & Finalize/i }));
    // L3 criteria table headers (from L3CriteriaTable) still render on Done.
    expect(screen.getByRole("columnheader", { name: /AI Verdict/i })).toBeTruthy();
  });
});
