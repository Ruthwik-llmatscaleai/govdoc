import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TopBar } from "./top-bar";

describe("TopBar", () => {
  it("renders GovDoc brand and user pill", () => {
    render(<TopBar user="joe" />);
    expect(screen.getByText("GovDoc")).toBeInTheDocument();
    expect(screen.getByText(/joe/i)).toBeInTheDocument();
  });

  it("includes a State of California subtitle", () => {
    render(<TopBar user="joe" />);
    expect(screen.getByText(/state of california/i)).toBeInTheDocument();
  });
});
