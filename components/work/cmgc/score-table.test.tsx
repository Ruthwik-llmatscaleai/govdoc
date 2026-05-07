import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ScoreTable } from "./score-table";
import { useOverridesStore } from "@/store/use-overrides";
import { mockRatings } from "@/lib/usecases/cmgc-pde/scoring/fixtures";

beforeEach(() => {
  useOverridesStore.getState().clear();
});

describe("ScoreTable", () => {
  it("renders 25 rating rows", () => {
    render(<ScoreTable ratings={mockRatings()} />);
    expect(screen.getAllByRole("row")).toHaveLength(26); // 1 header + 25 data
  });

  it("displays AI rating in the AI Rating column", () => {
    render(<ScoreTable ratings={mockRatings({ A1: "C" })} />);
    const a1Row = screen.getByText("A1").closest("tr")!;
    expect(a1Row.textContent).toContain("C");
  });

  it("changing the override select pushes to useOverridesStore", () => {
    render(<ScoreTable ratings={mockRatings()} />);
    const select = screen.getByLabelText("Override rating for A1") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "C" } });
    const history = useOverridesStore.getState().history;
    expect(history).toHaveLength(1);
    expect(history[0]?.category).toBe("A1");
    expect(history[0]?.newValue).toBe("C");
  });

  it("effective rating shows override when present", () => {
    render(<ScoreTable ratings={mockRatings()} />);
    const select = screen.getByLabelText("Override rating for A1") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "C" } });
    expect(select.value).toBe("C");
  });

  it("undo button removes the latest override", () => {
    render(<ScoreTable ratings={mockRatings()} />);
    const select = screen.getByLabelText("Override rating for A1") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "C" } });
    fireEvent.click(screen.getByRole("button", { name: /undo/i }));
    expect(useOverridesStore.getState().history).toHaveLength(0);
  });

  it("undo button is disabled when no overrides", () => {
    render(<ScoreTable ratings={mockRatings()} />);
    expect((screen.getByRole("button", { name: /undo/i }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("district mode hides toolbar and renders effective rating as plain text", () => {
    render(<ScoreTable ratings={mockRatings({ A1: "C" })} viewMode="district" />);
    expect(screen.queryByRole("button", { name: /undo/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /clear all overrides/i })).toBeNull();
    expect(screen.queryByRole("combobox")).toBeNull();
    // A1 AI rating is "C" — effective should appear as plain text
    const a1Row = screen.getByText("A1").closest("tr")!;
    expect(a1Row.querySelector("span.font-medium")?.textContent).toBe("C");
  });

  it("district mode shows overridden effective rating as plain text", () => {
    useOverridesStore.getState().push({ category: "A1", oldValue: "B", newValue: "C" });
    render(<ScoreTable ratings={mockRatings()} viewMode="district" />);
    const a1Row = screen.getByText("A1").closest("tr")!;
    expect(a1Row.querySelector("span.font-medium")?.textContent).toBe("C");
    expect(screen.queryByRole("combobox")).toBeNull();
  });
});
