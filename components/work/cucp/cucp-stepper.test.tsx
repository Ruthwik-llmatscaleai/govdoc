import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CucpStepper } from "./cucp-stepper";
import type { ExtractedFact, Criterion } from "@/lib/usecases/cucp-reevals/types";

const facts: ExtractedFact[] = [
  {
    id: "fact_1",
    when: "2018",
    where: "California",
    who: "Owner",
    what: "Personal loan to fund startup",
    why: "Family business",
    magnitude: "$50k",
    demographic_flag: true,
    source_quote: "I borrowed against my home.",
  },
];

const classifications = [
  {
    fact_id: "fact_1",
    category: "Social Disadvantage",
    summary: "Owner cited demographic bias.",
    ai_reasoning: "Affidavit references denied bids.",
  },
];

const criteria: Criterion[] = [
  {
    s_no: 1,
    category: "DBE Active",
    qualification: "Certification active and on file",
    rule_requires: "49 CFR §26.67(a)",
    evidence_summary: "Active certification verified.",
    reasoning: "On file in DBE registry.",
    pass_fail: "Pass",
    request_info: "No",
    confidence: 0.92,
  },
];

const baseProps = {
  runId: "r-1",
  facts,
  classifications,
  criteria,
  isReRunning: false,
  onComplete: () => {},
};

let fetchSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  fetchSpy = vi
    .spyOn(global, "fetch")
    .mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
});

afterEach(() => {
  fetchSpy.mockRestore();
});

describe("CucpStepper", () => {
  it("starts on Step 1 and shows the facts table (caltrans 9-col)", () => {
    render(<CucpStepper {...baseProps} />);
    expect(screen.getByRole("columnheader", { name: /Source Quote/i })).toBeTruthy();
  });

  it("L1 Approve & Continue advances to Step 2 without any fetch", () => {
    render(<CucpStepper {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /Approve & Continue/i }));
    expect(screen.getByRole("columnheader", { name: /Legal Category/i })).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("Back from Step 2 returns to Step 1 (facts table) without fetch", () => {
    render(<CucpStepper {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /Approve & Continue/i }));
    fireEvent.click(screen.getByRole("button", { name: /← Back to Facts/i }));
    expect(screen.getByRole("columnheader", { name: /Source Quote/i })).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("L2 Save Override POSTs to /level/2/override with the override payload", async () => {
    render(<CucpStepper {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /Approve & Continue/i })); // L1→L2

    fireEvent.change(screen.getByLabelText(/New category/i), {
      target: { value: "Economic Disadvantage" },
    });
    fireEvent.change(screen.getByLabelText(/Legal Rationale/i), {
      target: { value: "Income data shows financial hardship." },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save Override/i }));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe("/api/usecases/cucp-reevals/run/r-1/level/2/override");
    expect((init as RequestInit).method).toBe("POST");
    const body = JSON.parse((init as RequestInit).body as string) as { override: unknown };
    expect(body.override).toEqual({
      fact_id: "fact_1",
      new_category: "Economic Disadvantage",
      reason: "Income data shows financial hardship.",
    });
  });

  it("L2 Approve & Continue POSTs to /level/2/approve and advances to Step 3", async () => {
    render(<CucpStepper {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /Approve & Continue/i })); // L1→L2
    fireEvent.click(screen.getByRole("button", { name: /Approve & Continue/i })); // L2 approve

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe("/api/usecases/cucp-reevals/run/r-1/level/2/approve");
    expect((init as RequestInit).method).toBe("POST");

    await waitFor(() =>
      expect(screen.getByRole("columnheader", { name: /^Pass\/Fail$/i })).toBeTruthy(),
    );
  });

  it("L3 Save Override POSTs to /level/3/override with the override payload", async () => {
    render(<CucpStepper {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /Approve & Continue/i })); // L1→L2
    fireEvent.click(screen.getByRole("button", { name: /Approve & Continue/i })); // L2→L3
    await waitFor(() =>
      expect(screen.getByRole("columnheader", { name: /^Pass\/Fail$/i })).toBeTruthy(),
    );

    fetchSpy.mockClear();

    fireEvent.change(screen.getByLabelText(/New verdict/i), {
      target: { value: "Fail" },
    });
    fireEvent.change(screen.getByLabelText(/^Reason/i), {
      target: { value: "evidence does not establish certification" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save Override/i }));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe("/api/usecases/cucp-reevals/run/r-1/level/3/override");
    expect((init as RequestInit).method).toBe("POST");
    const body = JSON.parse((init as RequestInit).body as string) as { override: unknown };
    expect(body.override).toEqual({
      s_no: "1",
      verdict: "Fail",
      request_info: "No",
      reason: "evidence does not establish certification",
    });
  });

  it("L3 Submit & Finalize POSTs to /finalize, transitions to Done, and calls onComplete", async () => {
    const onComplete = vi.fn();
    render(<CucpStepper {...baseProps} onComplete={onComplete} />);
    fireEvent.click(screen.getByRole("button", { name: /Approve & Continue/i })); // L1→L2
    fireEvent.click(screen.getByRole("button", { name: /Approve & Continue/i })); // L2→L3
    await waitFor(() =>
      expect(screen.getByRole("columnheader", { name: /^Pass\/Fail$/i })).toBeTruthy(),
    );

    fetchSpy.mockClear();

    fireEvent.click(screen.getByRole("button", { name: /Submit & Finalize/i }));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe("/api/usecases/cucp-reevals/run/r-1/finalize");
    expect((init as RequestInit).method).toBe("POST");

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(screen.getByText(/L3 Criteria \(final\)/i)).toBeTruthy();
  });

  it("disables L2 Approve & Continue while isReRunning is true", () => {
    render(<CucpStepper {...baseProps} isReRunning={true} />);
    fireEvent.click(screen.getByRole("button", { name: /Approve & Continue/i })); // L1→L2
    const approveBtn = screen.getByRole("button", { name: /Approve & Continue/i });
    expect(approveBtn).toBeDisabled();
  });

  it("Back from Step 3 returns to Step 2 without fetch", async () => {
    render(<CucpStepper {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /Approve & Continue/i })); // L1→L2
    fireEvent.click(screen.getByRole("button", { name: /Approve & Continue/i })); // L2→L3
    await waitFor(() =>
      expect(screen.getByRole("columnheader", { name: /^Pass\/Fail$/i })).toBeTruthy(),
    );

    fetchSpy.mockClear();

    fireEvent.click(screen.getByRole("button", { name: /← Back to Categories/i }));
    expect(screen.getByRole("columnheader", { name: /Legal Category/i })).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("renders the request_info banner when criteria contain request_info=Yes", async () => {
    const criteriaWithRequestInfo: Criterion[] = [
      { ...criteria[0]!, request_info: "Yes" },
    ];
    render(<CucpStepper {...baseProps} criteria={criteriaWithRequestInfo} />);
    fireEvent.click(screen.getByRole("button", { name: /Approve & Continue/i })); // L1→L2
    fireEvent.click(screen.getByRole("button", { name: /Approve & Continue/i })); // L2 approve → POST → L3

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeTruthy();
    });
    expect(screen.getByText(/pending additional information/i)).toBeTruthy();
  });

  it("Done step still shows the L3 criteria table (regression check)", async () => {
    render(<CucpStepper {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /Approve & Continue/i })); // L1→L2
    fireEvent.click(screen.getByRole("button", { name: /Approve & Continue/i })); // L2→L3
    await waitFor(() =>
      expect(screen.getByRole("columnheader", { name: /^Pass\/Fail$/i })).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("button", { name: /Submit & Finalize/i }));

    await waitFor(() =>
      expect(screen.getByText(/L3 Criteria \(final\)/i)).toBeTruthy(),
    );
    expect(screen.getByRole("columnheader", { name: /^Pass\/Fail$/i })).toBeTruthy();
  });
});
