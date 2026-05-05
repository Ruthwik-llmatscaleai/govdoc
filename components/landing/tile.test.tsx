import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Tile } from "./tile";

describe("Tile", () => {
  it("renders title and blurb when enabled", () => {
    render(<Tile title="Search & Ask" blurb="Find answers" href="/work/search" enabled />);
    expect(screen.getByText("Search & Ask")).toBeInTheDocument();
    expect(screen.getByText("Find answers")).toBeInTheDocument();
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument();
  });

  it("shows Coming soon badge when disabled", () => {
    render(<Tile title="My Inbox" blurb="Approvals" href="/work/inbox" enabled={false} />);
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });
});
