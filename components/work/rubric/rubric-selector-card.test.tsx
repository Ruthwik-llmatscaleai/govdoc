import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RubricSelectorCard } from "./rubric-selector-card";

const rubrics = [
  { id: "default", label: "Default", isDefault: true, createdAt: "2026-05-14T00:00:00Z" },
  { id: "pilot", label: "DBE Pilot", isDefault: false, createdAt: "2026-05-14T00:00:00Z" },
];

const versions = [
  { id: "v002", createdAt: "2026-05-17T00:00:00Z", source: "edit", note: "tightened C-tier" },
  { id: "v001", createdAt: "2026-05-15T00:00:00Z", source: "seed" },
];

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (url.endsWith("/rubrics")) {
        return new Response(JSON.stringify({ rubrics }), { status: 200 });
      }
      if (url.endsWith("/versions")) {
        return new Response(JSON.stringify({ versions }), { status: 200 });
      }
      return new Response("{}", { status: 200 });
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("RubricSelectorCard", () => {
  it("loads rubrics, then versions, and emits the initial selection (default rubric, latest version)", async () => {
    const onChange = vi.fn();
    render(<RubricSelectorCard usecaseId="cmgc-pde" onChange={onChange} />);
    await waitFor(() => expect(screen.getByLabelText(/Rubric/i)).toBeTruthy());
    await waitFor(() => expect(onChange).toHaveBeenCalledWith({ rubricId: "default", versionId: "v002" }));
  });

  it("switching rubric resets version to the latest of that rubric", async () => {
    const onChange = vi.fn();
    render(<RubricSelectorCard usecaseId="cmgc-pde" onChange={onChange} />);
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    onChange.mockClear();
    fireEvent.change(screen.getByLabelText(/Rubric/i), { target: { value: "pilot" } });
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith({ rubricId: "pilot", versionId: "v002" }));
  });

  it("shows a CUCP/ROW limitation banner for non-CMGC use cases", () => {
    render(<RubricSelectorCard usecaseId="cucp-reevals" onChange={() => {}} />);
    expect(screen.getByText(/reference-only/i)).toBeTruthy();
  });

  it("does NOT show the limitation banner for CMGC", async () => {
    render(<RubricSelectorCard usecaseId="cmgc-pde" onChange={() => {}} />);
    expect(screen.queryByText(/reference-only/i)).toBeNull();
  });
});
