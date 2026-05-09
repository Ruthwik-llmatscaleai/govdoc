import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  L2ClassificationsTable,
  L2_LEGAL_CATEGORIES,
} from "./l2-classifications-table";

const rows = [
  {
    fact_id: "fact_1",
    category: "Social Disadvantage",
    summary: "Owner cited gender-based bidding bias.",
    ai_reasoning: "Affidavit references multiple denied bids.",
  },
  {
    fact_id: "fact_2",
    category: "Ordinary Business Risk",
    summary: "Lost a contract due to pricing.",
    ai_reasoning: "No demographic factor cited.",
  },
];

describe("L2ClassificationsTable", () => {
  it("renders the four caltrans column headers verbatim", () => {
    render(<L2ClassificationsTable rows={rows} onSaveOverride={() => {}} />);
    const headers = screen.getAllByRole("columnheader").map((h) => h.textContent);
    expect(headers).toEqual(["Fact #", "Legal Category", "Summary", "AI Reasoning"]);
  });

  it("renders one row per classification", () => {
    render(<L2ClassificationsTable rows={rows} onSaveOverride={() => {}} />);
    const dataRows = screen.getAllByRole("row").slice(1); // drop header
    expect(dataRows).toHaveLength(2);
    expect(dataRows[0]!.textContent).toMatch(/fact_1/);
    expect(dataRows[0]!.textContent).toMatch(/Social Disadvantage/);
    expect(dataRows[1]!.textContent).toMatch(/fact_2/);
    expect(dataRows[1]!.textContent).toMatch(/Ordinary Business Risk/);
  });

  it("offers all 6 caltrans-verbatim legal categories in the override dropdown", () => {
    render(<L2ClassificationsTable rows={rows} onSaveOverride={() => {}} />);
    const sel = screen.getByLabelText(/New category/i);
    const opts = Array.from(sel.querySelectorAll("option")).map((o) => o.textContent);
    expect(opts).toEqual([
      "Keep Current (Fix Reasoning Only)",
      "Social Disadvantage",
      "Economic Disadvantage",
      "Institutional/Systemic Barrier",
      "Ordinary Business Risk",
      "Insufficient Evidence",
    ]);
  });

  it("exports the legal categories constant for reuse", () => {
    expect(L2_LEGAL_CATEGORIES).toEqual([
      "Keep Current (Fix Reasoning Only)",
      "Social Disadvantage",
      "Economic Disadvantage",
      "Institutional/Systemic Barrier",
      "Ordinary Business Risk",
      "Insufficient Evidence",
    ]);
  });

  it("disables Save until reason is at least 15 chars", () => {
    render(<L2ClassificationsTable rows={rows} onSaveOverride={() => {}} />);
    const save = screen.getByRole("button", { name: /Save Override/i });
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Legal Rationale/i), {
      target: { value: "long enough reason" },
    });
    expect(save).toBeEnabled();
  });

  it("emits the selected fact, category and reason on save", () => {
    const onSaveOverride = vi.fn();
    render(<L2ClassificationsTable rows={rows} onSaveOverride={onSaveOverride} />);

    fireEvent.change(screen.getByLabelText(/Fact #/i), { target: { value: "fact_2" } });
    fireEvent.change(screen.getByLabelText(/New category/i), {
      target: { value: "Institutional/Systemic Barrier" },
    });
    fireEvent.change(screen.getByLabelText(/Legal Rationale/i), {
      target: { value: "Bid was tied to set-aside policy not skill." },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save Override/i }));

    expect(onSaveOverride).toHaveBeenCalledWith({
      fact_id: "fact_2",
      new_category: "Institutional/Systemic Barrier",
      reason: "Bid was tied to set-aside policy not skill.",
    });
  });

  it("clears the reason field after a save", () => {
    const onSaveOverride = vi.fn();
    render(<L2ClassificationsTable rows={rows} onSaveOverride={onSaveOverride} />);
    const reason = screen.getByLabelText(/Legal Rationale/i) as HTMLTextAreaElement;
    fireEvent.change(reason, { target: { value: "this reason is long enough" } });
    fireEvent.click(screen.getByRole("button", { name: /Save Override/i }));
    expect(reason.value).toBe("");
  });

  it("disables Save when the disabled prop is true even with a valid reason", () => {
    render(<L2ClassificationsTable rows={rows} onSaveOverride={() => {}} disabled={true} />);
    fireEvent.change(screen.getByLabelText(/Legal Rationale/i), {
      target: { value: "long enough reason here" },
    });
    expect(screen.getByRole("button", { name: /Save Override/i })).toBeDisabled();
  });
});
