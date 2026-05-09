import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PreviewRubricsPage from "./page";

describe("PreviewRubricsPage", () => {
  it("renders a tab for each of the 3 use cases", () => {
    render(<PreviewRubricsPage />);
    expect(screen.getByRole("tab", { name: /CMGC PDE/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /CUCP Re-evaluations/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /ROW Appraisal/i })).toBeInTheDocument();
  });

  it("defaults to CMGC and switches to CUCP on click", async () => {
    const user = userEvent.setup();
    render(<PreviewRubricsPage />);
    expect(screen.getByText(/Section weights/i)).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: /CUCP Re-evaluations/i }));
    expect(screen.getByRole("tab", { name: /Level 2/i })).toBeInTheDocument();
  });
});
