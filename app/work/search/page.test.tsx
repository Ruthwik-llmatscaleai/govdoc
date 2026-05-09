import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SearchAskPage from "./page";

describe("SearchAskPage (Preview / Edit picker)", () => {
  it("renders both option cards", () => {
    render(<SearchAskPage />);
    expect(screen.getByText("Preview Rubrics")).toBeInTheDocument();
    expect(screen.getByText("Edit Rubrics")).toBeInTheDocument();
  });

  it("Preview is enabled and links to /work/search/preview", () => {
    render(<SearchAskPage />);
    const link = screen.getByText("Preview Rubrics").closest("a");
    expect(link).not.toBeNull();
    expect(link).toHaveAttribute("href", "/work/search/preview");
  });

  it("Edit is enabled and links to /work/search/edit", () => {
    render(<SearchAskPage />);
    const link = screen.getByText("Edit Rubrics").closest("a");
    expect(link).not.toBeNull();
    expect(link).toHaveAttribute("href", "/work/search/edit");
  });
});
