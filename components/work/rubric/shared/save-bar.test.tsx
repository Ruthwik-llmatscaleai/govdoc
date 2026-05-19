import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SaveBar } from "./save-bar";

const v1Only = [{ id: "v1" }];
const v1AndMinor = [{ id: "v1.2" }, { id: "v1.1" }, { id: "v1" }];

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ versions: v1Only }), { status: 200 })),
  );
});

afterEach(() => vi.unstubAllGlobals());

describe("SaveBar", () => {
  it("renders 'Saved ✓' when clean", () => {
    render(
      <SaveBar
        usecaseId="cmgc-pde"
        rubricId="default"
        dirty={false}
        saving={false}
        msg={null}
        baselineVersionId="v1"
        downloadHref="/dl"
        downloadLabel=".xlsx"
        onReset={() => {}}
        onSave={async () => {}}
      />,
    );
    expect(screen.getByRole("button", { name: /Saved ✓/i })).toBeTruthy();
  });

  it("default split-button label uses next-minor when versions exist", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ versions: v1AndMinor }), { status: 200 })),
    );
    render(
      <SaveBar
        usecaseId="cmgc-pde"
        rubricId="default"
        dirty={true}
        saving={false}
        msg={null}
        baselineVersionId="v1.2"
        downloadHref="/dl"
        downloadLabel=".xlsx"
        onReset={() => {}}
        onSave={async () => {}}
      />,
    );
    await waitFor(() => expect(screen.getByRole("button", { name: /Save as v1\.3/i })).toBeTruthy());
  });

  it("clicking main split-button uses the default draft", async () => {
    const onSave = vi.fn(async () => {});
    render(
      <SaveBar
        usecaseId="cmgc-pde"
        rubricId="default"
        dirty={true}
        saving={false}
        msg={null}
        baselineVersionId="v1"
        downloadHref="/dl"
        downloadLabel=".xlsx"
        onReset={() => {}}
        onSave={onSave}
      />,
    );
    const main = await waitFor(() => screen.getByRole("button", { name: /Save as v1\.1/i }));
    fireEvent.click(main);
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ mode: "new", bump: "minor", useCustom: false }),
      ),
    );
  });

  it("chevron opens the popover", async () => {
    render(
      <SaveBar
        usecaseId="cmgc-pde"
        rubricId="default"
        dirty={true}
        saving={false}
        msg={null}
        baselineVersionId="v1"
        downloadHref="/dl"
        downloadLabel=".xlsx"
        onReset={() => {}}
        onSave={async () => {}}
      />,
    );
    await waitFor(() => screen.getByRole("button", { name: /Save as v1\.1/i }));
    fireEvent.click(screen.getByRole("button", { name: /Save options/i }));
    await waitFor(() => screen.getByRole("dialog", { name: /Save options/i }));
  });
});
