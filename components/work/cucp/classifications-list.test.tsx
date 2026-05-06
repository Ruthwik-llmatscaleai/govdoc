import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClassificationsList } from "./classifications-list";
import type { Classification } from "@/lib/usecases/cucp-reevals/types";

describe("ClassificationsList", () => {
  it("renders a placeholder when empty", () => {
    render(<ClassificationsList classifications={[]} />);
    expect(screen.getByText(/no classifications produced/i)).toBeDefined();
  });

  it("renders fact_id, classification label, summary, and reasoning", () => {
    const cls: Classification[] = [
      {
        fact_id: "f1",
        classification: "Social Disadvantage",
        summary: "Race-based loss",
        reasoning: "Direct discrimination evidence",
      },
    ];
    render(<ClassificationsList classifications={cls} />);
    expect(screen.getByText("f1")).toBeDefined();
    expect(screen.getByText(/social disadvantage/i)).toBeDefined();
    expect(screen.getByText(/race-based loss/i)).toBeDefined();
    expect(screen.getByText(/direct discrimination/i)).toBeDefined();
  });
});
