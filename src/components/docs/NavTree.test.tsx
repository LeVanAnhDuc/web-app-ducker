import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { NavTree } from "./NavTree";

const tree = [{
  id: "r", kind: "CONTAINER" as const, label: "Vệ tinh", href: null, isFallback: false,
  children: [
    { id: "a", kind: "APP" as const, label: "Match CV", href: "/vi/apps/match-cv", isFallback: false, children: [] },
    { id: "c", kind: "CONTAINER" as const, label: "Công cụ nhỏ", href: null, isFallback: false, children: [
      { id: "b", kind: "APP" as const, label: "Calculate Badminton", href: "/vi/apps/badminton", isFallback: false, children: [] },
    ]},
  ],
}];

describe("NavTree", () => {
  it("a container node is a toggle <button>, NOT a link", () => {
    render(<NavTree nodes={tree} activeHref="/vi/apps/match-cv" />);
    expect(screen.getByRole("button", { name: /Vệ tinh/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Vệ tinh/ })).toBeNull();
  });

  it("a leaf node is a link, NOT a toggle", () => {
    render(<NavTree nodes={tree} activeHref="/vi/apps/match-cv" />);
    expect(screen.getByRole("link", { name: "Match CV" })).toHaveAttribute("href", "/vi/apps/match-cv");
  });

  it("nests three levels deep", () => {
    render(<NavTree nodes={tree} activeHref="/vi/apps/badminton" />);
    expect(screen.getByRole("link", { name: "Calculate Badminton" })).toBeInTheDocument();
  });

  it("the branch holding the current entry starts expanded", () => {
    render(<NavTree nodes={tree} activeHref="/vi/apps/badminton" />);
    expect(screen.getByRole("button", { name: /Công cụ nhỏ/ })).toHaveAttribute("aria-expanded", "true");
  });

  it("clicking a container node collapses the branch", () => {
    render(<NavTree nodes={tree} activeHref="/vi/apps/badminton" />);
    const b = screen.getByRole("button", { name: /Vệ tinh/ });
    fireEvent.click(b);
    expect(b).toHaveAttribute("aria-expanded", "false");
  });
});

// ---------------------------------------------------------------------------
// Extra checks that the five tests above do not catch.
// ---------------------------------------------------------------------------

describe("NavTree — extra checks", () => {
  it("a leaf node has NO aria-expanded — it expands nothing", () => {
    render(<NavTree nodes={tree} activeHref="/vi/apps/match-cv" />);
    expect(screen.getByRole("link", { name: "Match CV" })).not.toHaveAttribute("aria-expanded");
  });

  it("the current entry is marked with aria-current; the pill is only a consequence", () => {
    render(<NavTree nodes={tree} activeHref="/vi/apps/match-cv" />);
    expect(screen.getByRole("link", { name: "Match CV" })).toHaveAttribute("aria-current", "page");
  });

  it("writes no hard-coded colour values", () => {
    const { container } = render(<NavTree nodes={tree} activeHref="/vi/apps/match-cv" />);
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{6}/i);
  });

  it("an empty tree renders nothing", () => {
    const { container } = render(<NavTree nodes={[]} activeHref="/vi" />);
    expect(container).toBeEmptyDOMElement();
  });
});
