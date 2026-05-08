import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StepBar } from "./step-bar";

describe("StepBar", () => {
  const steps = [
    { id: "a", label: "Review" },
    { id: "b", label: "Validate" },
    { id: "c", label: "Export" },
  ] as const;

  it("renders an ordered list of steps inside a nav", () => {
    render(<StepBar steps={steps} currentId="a" approvedIds={[]} onJump={() => {}} />);
    const nav = screen.getByRole("navigation");
    expect(nav.querySelector("ol")).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("marks the current step with aria-current=step", () => {
    render(<StepBar steps={steps} currentId="b" approvedIds={["a"]} onJump={() => {}} />);
    expect(screen.getByText("Validate").closest("li")).toHaveAttribute("aria-current", "step");
  });

  it("disables future (un-approved, non-current) steps", () => {
    render(<StepBar steps={steps} currentId="a" approvedIds={[]} onJump={() => {}} />);
    const exportBtn = screen.getByRole("button", { name: /Export/ });
    expect(exportBtn).toBeDisabled();
  });

  it("enables past (approved) steps for revisit", () => {
    render(<StepBar steps={steps} currentId="b" approvedIds={["a"]} onJump={() => {}} />);
    const reviewBtn = screen.getByRole("button", { name: /Review/ });
    expect(reviewBtn).toBeEnabled();
  });
});
