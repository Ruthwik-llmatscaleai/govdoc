import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InputsForm } from "./inputs-form";
import { usePipelineStore } from "@/store/use-pipeline";

beforeEach(() => {
  usePipelineStore.setState({ current: null });
});

describe("ROW InputsForm", () => {
  it("renders pdf input, provider select, and submit button", () => {
    render(<InputsForm />);
    expect(screen.getByLabelText(/appraisal pdf/i)).toBeDefined();
    expect(screen.getByLabelText(/AI provider/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /run evaluation/i })).toBeDefined();
  });

  it("lists all supported filenames", () => {
    render(<InputsForm />);
    expect(screen.getByText("Appraisal_EA2F590_Parcel_36668.pdf")).toBeDefined();
    expect(screen.getByText("Appraisal_EA_2F590_Parcel_36674 (1).pdf")).toBeDefined();
    expect(screen.getByText("Appraisal_EA_0J910,_Parcel_38355.pdf")).toBeDefined();
    expect(screen.getByText("37857_-_Lee_Appraisal.pdf")).toBeDefined();
  });

  it("calls usePipelineStore.start with row-appraisal on submit", async () => {
    const startSpy = vi.fn(async () => {});
    usePipelineStore.setState({ start: startSpy as never });
    render(<InputsForm />);

    const pdfInput = screen.getByLabelText(/appraisal pdf/i) as HTMLInputElement;
    const form = pdfInput.closest("form")!;
    fireEvent.submit(form);

    await new Promise((r) => setTimeout(r, 0));
    expect(startSpy).toHaveBeenCalledOnce();
    const args = startSpy.mock.calls[0] as unknown as [string, FormData];
    expect(args[0]).toBe("row-appraisal");
    expect(args[1]).toBeInstanceOf(FormData);
  });

  it("provider select defaults to openai", () => {
    render(<InputsForm />);
    const select = screen.getByLabelText(/AI provider/i) as HTMLSelectElement;
    expect(select.value).toBe("openai");
  });
});
