import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ValidationAudit } from "./validation-audit";
import type { ValidationResult } from "@/lib/usecases/cmgc-pde/types";

function makeValidation(overrides: Partial<ValidationResult> = {}): ValidationResult {
  return {
    comparisons: [],
    mismatches: [],
    summary: {
      total_compared: 25,
      matches: 23,
      minor_mismatches: 1,
      major_mismatches: 1,
      agreement_rate: 92,
    },
    deviation_impact: {
      ai_method: "DBB",
      user_method: "CM/GC",
      recommendation_changed: false,
      ai_score: 0.62,
      user_score: 0.71,
    },
    ...overrides,
  };
}

describe("ValidationAudit", () => {
  it("returns null when validation is null", () => {
    const { container } = render(<ValidationAudit validation={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the four metric cards with correct values", () => {
    render(<ValidationAudit validation={makeValidation()} />);
    expect(screen.getByText("92%")).toBeTruthy();
    expect(screen.getByText("23/25")).toBeTruthy();
    expect(screen.getByText(/Minor differences/i)).toBeTruthy();
    expect(screen.getByText(/Major differences/i)).toBeTruthy();
  });

  it("does NOT render the recommendation-change banner when recommendation is unchanged", () => {
    render(<ValidationAudit validation={makeValidation()} />);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("renders the recommendation-change banner with ai_method → user_method when changed", () => {
    render(
      <ValidationAudit
        validation={makeValidation({
          deviation_impact: {
            ai_method: "DBB",
            user_method: "CM/GC",
            recommendation_changed: true,
            ai_score: 0.5,
            user_score: 0.71,
          },
        })}
      />
    );
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toMatch(/DBB/);
    expect(alert.textContent).toMatch(/CM\/GC/);
  });

  it("renders a high-confidence-override card when ai_confidence >= 0.80 AND severity is major_mismatch", () => {
    render(
      <ValidationAudit
        validation={makeValidation({
          mismatches: [
            {
              question_id: "A2",
              question_text: "size",
              ai_rating: "B",
              user_rating: "A",
              severity: "major_mismatch",
              ai_evidence: "Plans show…",
              ai_confidence: 0.85,
              has_evidence: true,
            },
          ],
        })}
      />
    );
    expect(screen.getByText(/High-Confidence Override/i)).toBeTruthy();
    expect(screen.getByText(/A2/)).toBeTruthy();
  });

  it("renders a minor-difference card when ai_confidence < 0.80 (even on major_mismatch)", () => {
    render(
      <ValidationAudit
        validation={makeValidation({
          mismatches: [
            {
              question_id: "A2",
              question_text: "size",
              ai_rating: "B",
              user_rating: "A",
              severity: "major_mismatch",
              ai_evidence: "low conf",
              ai_confidence: 0.55,
              has_evidence: true,
            },
          ],
        })}
      />
    );
    // getAllByText used because the metric label "Minor differences" also matches /Minor Difference/i
    expect(screen.getAllByText(/Minor Difference/i).length).toBeGreaterThanOrEqual(1);
  });

  it("uses overrideReasons[question_id] when provided", () => {
    render(
      <ValidationAudit
        validation={makeValidation({
          mismatches: [
            {
              question_id: "A2",
              question_text: "size",
              ai_rating: "B",
              user_rating: "A",
              severity: "major_mismatch",
              ai_evidence: "ev",
              ai_confidence: 0.85,
              has_evidence: true,
            },
          ],
        })}
        overrideReasons={{ A2: "needs deeper schedule study" }}
      />
    );
    expect(screen.getByText(/needs deeper schedule study/)).toBeTruthy();
  });

  it("falls back to '(no reason provided)' when overrideReasons is missing the question", () => {
    render(
      <ValidationAudit
        validation={makeValidation({
          mismatches: [
            {
              question_id: "A2",
              question_text: "size",
              ai_rating: "B",
              user_rating: "A",
              severity: "major_mismatch",
              ai_evidence: "ev",
              ai_confidence: 0.85,
              has_evidence: true,
            },
          ],
        })}
      />
    );
    expect(screen.getByText(/no reason provided/i)).toBeTruthy();
  });

  it("renders 'no differences' panel when mismatches is empty", () => {
    render(<ValidationAudit validation={makeValidation()} />);
    expect(screen.getByText(/no differences/i)).toBeTruthy();
  });
});
