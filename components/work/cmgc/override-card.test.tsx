import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OverrideCard, type OverrideCardQuestion } from "./override-card";

function makeQuestion(overrides: Partial<OverrideCardQuestion> = {}): OverrideCardQuestion {
  return {
    question_id: "A2",
    question_text: "What is the size of the Project?",
    ai_rating: "B",
    confidence: 0.67,
    source_reasoning: "Plans show 60% design complete and $48M capital.",
    options: {
      A: "Small project (less than $25 million construction capital cost).",
      B: "Medium size project (between $25 to $75 million construction capital cost).",
      C: "Large project (greater than $75 million construction capital cost).",
    },
    ...overrides,
  };
}

describe("OverrideCard", () => {
  it("renders the question id, text, and AI rating", () => {
    render(<OverrideCard question={makeQuestion()} onSave={() => {}} />);
    expect(screen.getByText(/A2/)).toBeTruthy();
    expect(screen.getByText(/What is the size of the Project/)).toBeTruthy();
    expect(screen.getByText(/AI Rating:/)).toBeTruthy();
  });

  it("renders all three rubric options A/B/C with their full text", () => {
    render(<OverrideCard question={makeQuestion()} onSave={() => {}} />);
    expect(screen.getByText(/Small project/)).toBeTruthy();
    expect(screen.getByText(/Medium size project/)).toBeTruthy();
    expect(screen.getByText(/Large project/)).toBeTruthy();
  });

  it("does NOT render a D option (caltrans uses 3 ratings only)", () => {
    render(<OverrideCard question={makeQuestion()} onSave={() => {}} />);
    expect(screen.queryByText(/Mega project/)).toBeNull();
    const select = screen.getByLabelText(/Your Rating Override/i) as HTMLSelectElement;
    expect(select.options).toHaveLength(3);
  });

  it("disables Save until rating changed AND reason ≥ 15 chars", () => {
    const onSave = vi.fn();
    render(<OverrideCard question={makeQuestion()} onSave={onSave} />);
    const save = screen.getByRole("button", { name: /Save Override/i });
    expect(save).toBeDisabled();

    // Change rating only — still disabled (no reason)
    fireEvent.change(screen.getByLabelText(/Your Rating Override/i), { target: { value: "A" } });
    expect(save).toBeDisabled();

    // Type 14 chars — still disabled
    fireEvent.change(screen.getByLabelText(/Why are you changing/i), { target: { value: "12345678901234" } });
    expect(save).toBeDisabled();

    // Type 15 chars — enabled
    fireEvent.change(screen.getByLabelText(/Why are you changing/i), { target: { value: "needs full study" } }); // 16 chars
    expect(save).toBeEnabled();

    // Same rating + valid reason — disabled (rating must change)
    fireEvent.change(screen.getByLabelText(/Your Rating Override/i), { target: { value: "B" } });
    expect(save).toBeDisabled();
  });

  it("calls onSave with old/new rating and trimmed reason", () => {
    const onSave = vi.fn();
    render(<OverrideCard question={makeQuestion()} onSave={onSave} />);
    fireEvent.change(screen.getByLabelText(/Your Rating Override/i), { target: { value: "A" } });
    fireEvent.change(screen.getByLabelText(/Why are you changing/i), { target: { value: "  needs full study " } }); // padding
    fireEvent.click(screen.getByRole("button", { name: /Save Override/i }));
    expect(onSave).toHaveBeenCalledWith({
      question_id: "A2",
      oldValue: "B",
      newValue: "A",
      reason: "needs full study", // trimmed
    });
  });

  it("toggles AI evidence on click", () => {
    render(<OverrideCard question={makeQuestion()} onSave={() => {}} />);
    expect(screen.queryByText(/Plans show 60% design complete/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /View AI Evidence/i }));
    expect(screen.getByText(/Plans show 60% design complete/)).toBeTruthy();
  });

  it("shows confidence as a percentage when provided", () => {
    render(<OverrideCard question={makeQuestion({ confidence: 0.67 })} onSave={() => {}} />);
    expect(screen.getByText(/Confidence: 67%/)).toBeTruthy();
  });

  it("omits confidence label when confidence is null", () => {
    render(<OverrideCard question={makeQuestion({ confidence: null })} onSave={() => {}} />);
    expect(screen.queryByText(/Confidence:/)).toBeNull();
  });

  it("pre-fills from existing draft if provided", () => {
    render(
      <OverrideCard
        question={makeQuestion({ existing: { newRating: "C", reason: "previously typed reason here" } })}
        onSave={() => {}}
      />
    );
    expect((screen.getByLabelText(/Your Rating Override/i) as HTMLSelectElement).value).toBe("C");
    expect((screen.getByLabelText(/Why are you changing/i) as HTMLTextAreaElement).value).toBe("previously typed reason here");
  });
});
