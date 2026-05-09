import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CucpRubricView } from "./cucp-rubric-view";
import {
  CUCP_L2_CATEGORIES,
  CUCP_L3_CRITERIA,
} from "@/lib/usecases/cucp-reevals/rubric";

describe("CucpRubricView", () => {
  it("defaults to the L2 tab and shows all 5 legal categories", () => {
    render(<CucpRubricView />);
    for (const c of CUCP_L2_CATEGORIES) {
      expect(screen.getByText(c.name)).toBeInTheDocument();
      expect(screen.getByText(c.description)).toBeInTheDocument();
    }
  });

  it("switches to the L3 tab and renders all 7 criteria", async () => {
    const user = userEvent.setup();
    render(<CucpRubricView />);
    await user.click(screen.getByRole("tab", { name: /Level 3/i }));
    for (const c of CUCP_L3_CRITERIA) {
      expect(screen.getByText(c.name)).toBeInTheDocument();
      expect(screen.getByText(String(c.s_no))).toBeInTheDocument();
    }
  });

  it("renders an em-dash for criteria that have no rule", async () => {
    const user = userEvent.setup();
    render(<CucpRubricView />);
    await user.click(screen.getByRole("tab", { name: /Level 3/i }));
    // 6 of 7 criteria have no rule → 6 em-dashes in the Rule column.
    const dashCells = screen.getAllByText("—");
    expect(dashCells.length).toBeGreaterThanOrEqual(6);
  });
});
