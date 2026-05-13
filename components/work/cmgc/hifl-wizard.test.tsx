import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HiflWizard, type HiflOverrideEntry } from "./hifl-wizard";
import type { OverrideCardQuestion } from "./override-card";

function makeQuestion(id: string, overrides: Partial<OverrideCardQuestion> = {}): OverrideCardQuestion {
  return {
    question_id: id,
    question_text: `Question ${id}`,
    ai_rating: "B",
    confidence: 0.8,
    source_reasoning: "AI evidence",
    options: { A: "alpha", B: "bravo", C: "charlie" },
    ...overrides,
  };
}

describe("HiflWizard", () => {
  const baseProps = {
    questions: [makeQuestion("A1"), makeQuestion("A2")],
    recommendationLabel: "DBB",
    overrides: [] as HiflOverrideEntry[],
    onSaveOverride: () => {},
    onRemoveOverride: () => {},
  };

  it("starts on Step 1 (Review & Override)", () => {
    render(<HiflWizard {...baseProps} />);
    expect(screen.getByRole("button", { name: /Approve & Export/i })).toBeTruthy();
  });

  it("disables Approve & Export when no overrides AND no acknowledgment", () => {
    render(<HiflWizard {...baseProps} />);
    expect(screen.getByRole("button", { name: /Approve & Export/i })).toBeDisabled();
  });

  it("enables Approve & Export when 'no changes needed' is clicked", () => {
    render(<HiflWizard {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /reviewed all flagged questions/i }));
    expect(screen.getByRole("button", { name: /Approve & Export/i })).toBeEnabled();
  });

  it("enables Approve & Export when there is at least one override", () => {
    render(
      <HiflWizard
        {...baseProps}
        overrides={[{ question_id: "A1", oldValue: "B", newValue: "A", reason: "needs deeper study yes" }]}
      />
    );
    expect(screen.getByRole("button", { name: /Approve & Export/i })).toBeEnabled();
  });

  it("Back from Export returns to Review with overrides preserved", () => {
    const { rerender } = render(
      <HiflWizard
        {...baseProps}
        overrides={[{ question_id: "A1", oldValue: "B", newValue: "A", reason: "needs deeper study yes" }]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Approve & Export/i }));
    fireEvent.click(screen.getByRole("button", { name: /← Back/i }));
    rerender(
      <HiflWizard
        {...baseProps}
        overrides={[{ question_id: "A1", oldValue: "B", newValue: "A", reason: "needs deeper study yes" }]}
      />
    );
    expect(screen.getAllByText(/A1/).length).toBeGreaterThan(0);
  });

  it("Approve & Export reveals the Export recap", () => {
    render(
      <HiflWizard
        {...baseProps}
        overrides={[{ question_id: "A1", oldValue: "B", newValue: "A", reason: "needs deeper study yes" }]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Approve & Export/i }));
    expect(screen.getByText(/Review complete/i)).toBeTruthy();
    expect(screen.getByText(/Final recommendation/i)).toBeTruthy();
  });

  it("renders the markdown summary report on the Export step when provided", () => {
    render(
      <HiflWizard
        {...baseProps}
        markdownReport={"# Project Delivery Evaluation\n\n**Recommended method:** CM/GC"}
        overrides={[{ question_id: "A1", oldValue: "B", newValue: "A", reason: "needs deeper study yes" }]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Approve & Export/i }));
    expect(screen.getByText(/Project Delivery Evaluation/i)).toBeTruthy();
  });

  it("offers a 'Switch to District view' button when onPreviewDistrict is provided", () => {
    const onPreview = vi.fn();
    render(
      <HiflWizard
        {...baseProps}
        onPreviewDistrict={onPreview}
        overrides={[{ question_id: "A1", oldValue: "B", newValue: "A", reason: "needs deeper study yes" }]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Approve & Export/i }));
    const switchBtn = screen.getByRole("button", { name: /Switch to District view/i });
    fireEvent.click(switchBtn);
    expect(onPreview).toHaveBeenCalledTimes(1);
  });

  it("Back from Export now reads 'Back to Review'", () => {
    render(
      <HiflWizard
        {...baseProps}
        overrides={[{ question_id: "A1", oldValue: "B", newValue: "A", reason: "needs deeper study yes" }]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Approve & Export/i }));
    expect(screen.getByRole("button", { name: /Back to Review/i })).toBeTruthy();
  });

  it("Pending Corrections shows current overrides with a Remove button", () => {
    const onRemove = vi.fn();
    render(
      <HiflWizard
        {...baseProps}
        onRemoveOverride={onRemove}
        overrides={[{ question_id: "A1", oldValue: "B", newValue: "A", reason: "needs deeper study yes" }]}
      />
    );
    expect(screen.getAllByText(/A1/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /Remove/i }));
    expect(onRemove).toHaveBeenCalledWith("A1");
  });

  it("question filter 'Missing Info Only' narrows the list", () => {
    render(
      <HiflWizard
        {...baseProps}
        questions={[
          makeQuestion("A1", { confidence: 0.95, source_reasoning: "good evidence" }),
          makeQuestion("A2", { confidence: 0.4, source_reasoning: "" }),
        ]}
      />
    );
    fireEvent.click(screen.getByLabelText(/Missing Info Only/i));
    const select = screen.getByLabelText(/Select question/i) as HTMLSelectElement;
    const optionTexts = Array.from(select.options).map((o) => o.textContent ?? "");
    expect(optionTexts.some((t) => t.includes("A2"))).toBe(true);
    expect(optionTexts.some((t) => t.includes("A1"))).toBe(false);
  });
});
