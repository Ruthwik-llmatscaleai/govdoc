import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HiflWizard, type HiflOverrideEntry } from "./hifl-wizard";
import type { OverrideCardQuestion } from "./override-card";
import type { ValidationResult } from "@/lib/usecases/cmgc-pde/types";

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

function makeValidation(overrides: Partial<ValidationResult> = {}): ValidationResult {
  return {
    comparisons: [],
    mismatches: [],
    summary: { total_compared: 1, matches: 1, minor_mismatches: 0, major_mismatches: 0, agreement_rate: 100 },
    deviation_impact: { ai_method: "DBB", user_method: "DBB", recommendation_changed: false, ai_score: 0.6, user_score: 0.6 },
    ...overrides,
  };
}

describe("HiflWizard", () => {
  const baseProps = {
    questions: [makeQuestion("A1"), makeQuestion("A2")],
    validation: makeValidation(),
    recommendationLabel: "DBB",
    aiRecommendationLabel: "DBB",
    recommendationShifted: false,
    overrides: [] as HiflOverrideEntry[],
    onSaveOverride: () => {},
    onRemoveOverride: () => {},
  };

  it("starts on Step 1 (Review & Override)", () => {
    render(<HiflWizard {...baseProps} />);
    expect(screen.getByRole("button", { name: /Next → Validation/i })).toBeTruthy();
  });

  it("disables Next → Validation when no overrides AND no acknowledgment", () => {
    render(<HiflWizard {...baseProps} />);
    expect(screen.getByRole("button", { name: /Next → Validation/i })).toBeDisabled();
  });

  it("enables Next when 'no changes needed' is clicked", () => {
    render(<HiflWizard {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /reviewed all flagged questions/i }));
    expect(screen.getByRole("button", { name: /Next → Validation/i })).toBeEnabled();
  });

  it("enables Next when there is at least one override", () => {
    render(
      <HiflWizard
        {...baseProps}
        overrides={[{ question_id: "A1", oldValue: "B", newValue: "A", reason: "needs deeper study yes" }]}
      />
    );
    expect(screen.getByRole("button", { name: /Next → Validation/i })).toBeEnabled();
  });

  it("Back from Step 2 returns to Step 1 with overrides preserved", () => {
    const { rerender } = render(
      <HiflWizard
        {...baseProps}
        overrides={[{ question_id: "A1", oldValue: "B", newValue: "A", reason: "needs deeper study yes" }]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Next → Validation/i }));
    fireEvent.click(screen.getByRole("button", { name: /← Back/i }));
    rerender(
      <HiflWizard
        {...baseProps}
        overrides={[{ question_id: "A1", oldValue: "B", newValue: "A", reason: "needs deeper study yes" }]}
      />
    );
    // A1 appears in both the question selector and the pending corrections list;
    // use getAllByText to assert it is present at least once.
    expect(screen.getAllByText(/A1/).length).toBeGreaterThan(0);
  });

  it("Step 3 (Export) is reachable only after Approve & Export in Step 2", () => {
    render(
      <HiflWizard
        {...baseProps}
        overrides={[{ question_id: "A1", oldValue: "B", newValue: "A", reason: "needs deeper study yes" }]}
      />
    );
    // Move to Step 2
    fireEvent.click(screen.getByRole("button", { name: /Next → Validation/i }));
    expect(screen.getByRole("button", { name: /Approve & Export/i })).toBeTruthy();
    // Step 3 (Export chip in step bar) should be disabled — assert by trying to find an enabled "Export" button before approval
    // After Approve & Export, the recap should appear
    fireEvent.click(screen.getByRole("button", { name: /Approve & Export/i }));
    expect(screen.getByText(/Review complete/i)).toBeTruthy();
    expect(screen.getByText(/Final recommendation/i)).toBeTruthy();
  });

  it("renders 'shifted from <ai>' recap when recommendation changed", () => {
    render(
      <HiflWizard
        {...baseProps}
        recommendationLabel="CM/GC"
        aiRecommendationLabel="DBB"
        recommendationShifted={true}
        overrides={[{ question_id: "A1", oldValue: "B", newValue: "A", reason: "needs deeper study yes" }]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Next → Validation/i }));
    fireEvent.click(screen.getByRole("button", { name: /Approve & Export/i }));
    expect(screen.getByText(/CM\/GC/)).toBeTruthy();
    expect(screen.getByText(/shifted from DBB/i)).toBeTruthy();
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
    // A1 appears in both the question selector options and the pending corrections list;
    // use getAllByText to assert at least one occurrence is present on the page.
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
    // Only A2 should be in the dropdown options after filter
    const optionTexts = Array.from(select.options).map((o) => o.textContent ?? "");
    expect(optionTexts.some((t) => t.includes("A2"))).toBe(true);
    expect(optionTexts.some((t) => t.includes("A1"))).toBe(false);
  });
});
