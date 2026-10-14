import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Toc } from "./Toc";

describe("Toc", () => {
  it("builds anchor links from each item's anchor", () => {
    render(<Toc items={[{ anchor: "la-gi", title: "Là gì" }]} title="Trong trang" />);
    expect(screen.getByRole("link", { name: "Là gì" })).toHaveAttribute("href", "#la-gi");
  });
  it("renders no empty frame when there are no items", () => {
    const { container } = render(<Toc items={[]} title="Trong trang" />);
    expect(container).toBeEmptyDOMElement();
  });
});
