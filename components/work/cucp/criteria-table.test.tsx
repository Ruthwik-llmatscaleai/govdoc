import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CriteriaTable } from "./criteria-table";
import type { Criterion } from "@/lib/usecases/cucp-reevals/types";

const seven = (): Criterion[] =>
  Array.from({ length: 7 }, (_, i) => ({
    s_no: i + 1,
    category: `Cat ${i + 1}`,
    qualification: `Q ${i + 1}`,
    rule_requires: "rule",
    evidence_summary: "ev",
    reasoning: `AI reasoning ${i + 1}`,
    pass_fail: "Pass" as const,
    request_info: "No" as const,
    confidence: 9.0,
  }));

beforeEach(() => {
  globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })) as never;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CriteriaTable", () => {
  it("renders 7 rows + submit button", () => {
    render(<CriteriaTable criteria={seven()} runId="r-1" />);
    expect(screen.getAllByRole("row")).toHaveLength(8); // header + 7
    expect(screen.getByRole("button", { name: /submit overrides/i })).toBeDefined();
  });

  it("submits empty overrides array when no edits made", async () => {
    const onSubmitted = vi.fn();
    render(<CriteriaTable criteria={seven()} runId="r-2" onSubmitted={onSubmitted} />);
    fireEvent.click(screen.getByRole("button", { name: /submit overrides/i }));
    await waitFor(() => expect(onSubmitted).toHaveBeenCalledOnce());
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/usecases/cucp-reevals/run/r-2/respond",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ overrides: [] }),
      }),
    );
  });

  it("emits a pass_fail override when row 3 is flipped to Fail", async () => {
    const onSubmitted = vi.fn();
    render(<CriteriaTable criteria={seven()} runId="r-3" onSubmitted={onSubmitted} />);
    const sel = screen.getByLabelText(/pass\/fail for criterion 3/i) as HTMLSelectElement;
    fireEvent.change(sel, { target: { value: "Fail" } });
    const reason = screen.getByLabelText(/override reasoning for criterion 3/i) as HTMLInputElement;
    fireEvent.change(reason, { target: { value: "Insufficient evidence" } });
    fireEvent.click(screen.getByRole("button", { name: /submit overrides/i }));
    await waitFor(() => expect(onSubmitted).toHaveBeenCalledOnce());
    const calls = (globalThis.fetch as unknown as { mock: { calls: [string, { body: string }][] } }).mock.calls;
    const body = JSON.parse(calls[0]![1].body);
    expect(body.overrides).toEqual([
      { s_no: 3, field: "pass_fail", value: "Fail", reasoning: "Insufficient evidence" },
    ]);
  });

  it("shows an error message when respond returns non-200", async () => {
    globalThis.fetch = vi.fn(async () => new Response("not found", { status: 404 })) as never;
    render(<CriteriaTable criteria={seven()} runId="r-bad" />);
    fireEvent.click(screen.getByRole("button", { name: /submit overrides/i }));
    await waitFor(() => expect(screen.getByText(/submit failed \(404\)/i)).toBeDefined());
  });

  it("renders an Approve all button that submits with empty overrides", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchSpy);

    const criteria = [
      { s_no: 1, category: "X", qualification: "y", pass_fail: "Pass", request_info: "No", reasoning: "..." },
    ] as any;
    const onSubmitted = vi.fn();
    render(<CriteriaTable criteria={criteria} runId="run-123" onSubmitted={onSubmitted} />);

    await userEvent.click(screen.getByRole("button", { name: /approve all/i }));
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/usecases/cucp-reevals/run/run-123/respond",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ overrides: [] }),
      }),
    );
    expect(onSubmitted).toHaveBeenCalled();
  });

  it("disables submit while a request is in flight", async () => {
    let resolveFetch!: (v: any) => void;
    vi.stubGlobal("fetch", () => new Promise((r) => { resolveFetch = r; }));
    const criteria = [
      { s_no: 1, category: "X", qualification: "y", pass_fail: "Pass", request_info: "No", reasoning: "..." },
    ] as any;
    render(<CriteriaTable criteria={criteria} runId="run-1" />);
    await userEvent.click(screen.getByRole("button", { name: /submit overrides/i }));
    expect(screen.getByRole("button", { name: /submitting/i })).toBeDisabled();
    resolveFetch({ ok: true });
  });

  it("disables Approve all while a submit is in flight", async () => {
    let resolveFetch!: (v: any) => void;
    vi.stubGlobal("fetch", () => new Promise((r) => { resolveFetch = r; }));
    const criteria = [
      { s_no: 1, category: "X", qualification: "y", pass_fail: "Pass", request_info: "No", reasoning: "..." },
    ] as any;
    render(<CriteriaTable criteria={criteria} runId="run-1" />);
    await userEvent.click(screen.getByRole("button", { name: /submit overrides/i }));
    expect(screen.getByRole("button", { name: /approve all/i })).toBeDisabled();
    resolveFetch({ ok: true });
  });
});
