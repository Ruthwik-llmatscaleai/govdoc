import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RubricShell } from "./rubric-shell";

describe("RubricShell", () => {
  it("renders the intro slot above the sections slot", () => {
    render(
      <RubricShell intro={<div data-testid="intro">intro</div>}>
        <div data-testid="body">body</div>
      </RubricShell>,
    );
    expect(screen.getByTestId("intro")).toBeInTheDocument();
    expect(screen.getByTestId("body")).toBeInTheDocument();
  });

  it("renders without intro when omitted", () => {
    render(
      <RubricShell>
        <div data-testid="body">body</div>
      </RubricShell>,
    );
    expect(screen.getByTestId("body")).toBeInTheDocument();
  });
});
