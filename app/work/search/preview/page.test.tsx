import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PreviewRubricTabs } from "@/components/work/rubric/preview-tabs";
import { defaultCmgcRubric } from "@/lib/usecases/cmgc-pde/rubric-merged";
import { defaultCucpRubric } from "@/lib/usecases/cucp-reevals/rubric-merged";
import { defaultRowRubric } from "@/lib/usecases/row-appraisal/rubric-merged";

describe("PreviewRubricTabs", () => {
  function renderTabs() {
    return render(
      <PreviewRubricTabs
        cmgc={defaultCmgcRubric()}
        cucp={defaultCucpRubric()}
        row={defaultRowRubric()}
      />,
    );
  }

  it("renders a tab for each of the 3 use cases", () => {
    renderTabs();
    expect(screen.getByRole("tab", { name: /CMGC PDE/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /CUCP Re-evaluations/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /ROW Appraisal/i })).toBeInTheDocument();
  });

  it("defaults to CMGC and switches to CUCP on click", async () => {
    const user = userEvent.setup();
    renderTabs();
    expect(screen.getByText(/Section weights/i)).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: /CUCP Re-evaluations/i }));
    expect(screen.getByRole("tab", { name: /Level 2/i })).toBeInTheDocument();
  });
});
