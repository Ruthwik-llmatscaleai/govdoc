import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SearchAskPage from "./page";

describe("SearchAskPage (Preview / Manage picker)", () => {
  it("renders both option cards", () => {
    render(<SearchAskPage />);
    // Title text is split across <h3>Preview <em>Rubrics</em></h3>; assert on the
    // accent-only piece that uniquely identifies each tile.
    expect(screen.getByText("Preview")).toBeInTheDocument();
    expect(screen.getByText("Manage")).toBeInTheDocument();
  });

  it("Preview links to /work/search/preview", () => {
    render(<SearchAskPage />);
    const link = screen.getByText("Preview").closest("a");
    expect(link).not.toBeNull();
    expect(link).toHaveAttribute("href", "/work/search/preview");
  });

  it("Manage links to /work/search/edit", () => {
    render(<SearchAskPage />);
    const link = screen.getByText("Manage").closest("a");
    expect(link).not.toBeNull();
    expect(link).toHaveAttribute("href", "/work/search/edit");
  });
});
