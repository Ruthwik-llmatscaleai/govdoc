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

  it("Edit is marked Coming soon and is not a link", () => {
    render(<SearchAskPage />);
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
    const editLink = screen.queryAllByRole("link").find((a) => a.textContent?.includes("Edit Rubrics"));
    expect(editLink).toBeUndefined();
  });
});
