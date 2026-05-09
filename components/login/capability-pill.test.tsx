import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CapabilityPill } from "./capability-pill";

describe("CapabilityPill", () => {
  it("renders the label text", () => {
    render(<CapabilityPill label="Document Compare" dotColor="oklch(0.55 0.18 295)" />);
    expect(screen.getByText("Document Compare")).toBeInTheDocument();
  });

  it("applies the provided dot color via inline style", () => {
    const { container } = render(
      <CapabilityPill label="Regulatory Watch" dotColor="oklch(0.72 0.16 50)" />,
    );
    const dot = container.querySelector('[aria-hidden="true"]') as HTMLElement | null;
    expect(dot).not.toBeNull();
    expect(dot!.style.backgroundColor).toBe("oklch(0.72 0.16 50)");
  });

  it("merges in caller className", () => {
    const { container } = render(
      <CapabilityPill label="Decision Support" dotColor="oklch(0.62 0.20 350)" className="extra" />,
    );
    expect(container.firstChild).toHaveClass("extra");
  });
});
