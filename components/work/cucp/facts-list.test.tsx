import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FactsList } from "./facts-list";
import type { ExtractedFact } from "@/lib/usecases/cucp-reevals/types";

describe("FactsList", () => {
  it("renders a placeholder when no facts present", () => {
    render(<FactsList facts={[]} />);
    expect(screen.getByText(/no facts extracted/i)).toBeDefined();
  });

  it("renders one item per fact with key fields", () => {
    const facts: ExtractedFact[] = [
      {
        id: "f1",
        when: "2024",
        where: "Bay Area",
        who: "Owner",
        what: "Lost contract",
        why: "Bias",
        magnitude: "$50k",
        demographic_flag: true,
        source_quote: "quoted text",
      },
    ];
    render(<FactsList facts={facts} />);
    expect(screen.getByText(/lost contract/i)).toBeDefined();
    expect(screen.getByText(/2024 • Bay Area • Owner/)).toBeDefined();
    expect(screen.getByText(/quoted text/i)).toBeDefined();
  });
});
