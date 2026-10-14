import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DocsShell } from "./DocsShell";
import { Sidebar } from "./Sidebar";

describe("DocsShell", () => {
  it("reserves columns only for the parts that actually have content", () => {
    const { container } = render(<DocsShell main={<p>Nội dung</p>} />);
    const shell = container.firstElementChild!;
    expect(shell.getAttribute("data-sidebar")).toBe("no");
    expect(shell.getAttribute("data-toc")).toBe("no");
  });

  it("with all three columns, the grid knows about all three", () => {
    const { container } = render(
      <DocsShell sidebar={<nav />} main={<p>Nội dung</p>} toc={<nav />} />,
    );
    const shell = container.firstElementChild!;
    expect(shell.getAttribute("data-sidebar")).toBe("yes");
    expect(shell.getAttribute("data-toc")).toBe("yes");
  });
});

describe("Sidebar", () => {
  const nodes = [
    {
      id: "core", kind: "CONTAINER" as const, label: "Lõi", href: null, isFallback: false,
      children: [
        { id: "a", kind: "APP" as const, label: "Ducker ID", href: "/vi/apps/a", isFallback: false, children: [] },
      ],
    },
  ];

  it("marks the current page with aria-current", () => {
    render(<Sidebar nodes={nodes} activeHref="/vi/apps/a" label="Điều hướng tài liệu" />);
    expect(screen.getByRole("link", { name: "Ducker ID" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("the navigation region is named so screen readers can tell it from the tab strip", () => {
    render(<Sidebar nodes={nodes} activeHref="/vi/apps/a" label="Điều hướng tài liệu" />);
    expect(screen.getByRole("navigation", { name: "Điều hướng tài liệu" })).toBeInTheDocument();
  });

  it("renders no empty column when there are no nodes", () => {
    const { container } = render(<Sidebar nodes={[]} activeHref="/vi" label="Điều hướng tài liệu" />);
    expect(container).toBeEmptyDOMElement();
  });
});
